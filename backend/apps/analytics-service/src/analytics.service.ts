import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  KafkaConsumer,
  KafkaProducer,
  IdempotencyHandler,
} from "@kafkadog/kafka";
import {
  TopProductsUpdated,
  TopProductsUpdatedSchema,
  OrderPlacedSchema,
} from "@kafkadog/contracts";
import { v4 as uuidv4 } from "uuid";

interface ProductStats {
  productId: string;
  count: number;
  revenue: number;
  lastUpdated: string;
}

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private consumer: KafkaConsumer;
  private producer: KafkaProducer;
  private idempotencyHandler: IdempotencyHandler;

  // In-memory analytics store
  private productStats: Map<string, ProductStats> = new Map();
  private totalOrders: number = 0;
  private totalRevenue: number = 0;
  private lastSnapshotTime: string = new Date().toISOString();

  // Snapshot interval (5 minutes)
  private readonly SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

  constructor() {
    const kafkaConfig = {
      brokers: (process.env as Record<string, string | undefined>)[
        "KAFKA_BROKERS"
      ]?.split(",") || ["localhost:9092"],
      clientId:
        (process.env as Record<string, string | undefined>)[
          "KAFKA_CLIENT_ID"
        ] || "analytics-service",
    };

    this.consumer = new KafkaConsumer(kafkaConfig, {
      groupId: "analytics-service-group",
      topics: ["orders.v1"],
    });

    this.producer = new KafkaProducer(kafkaConfig);
    this.idempotencyHandler = new IdempotencyHandler();
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe to order events
    await this.consumer.subscribe(async (payload) => {
      await this.handleOrderPlaced(payload);
    });

    // Start periodic snapshot generation
    this.startPeriodicSnapshots();

    console.log("[AnalyticsService] Started and listening for order events");
  }

  private async handleOrderPlaced(payload: any) {
    try {
      const { topic, partition, message } = payload;
      const event = JSON.parse(message.value.toString());

      // Check idempotency
      if (
        this.idempotencyHandler.isDuplicate(topic, partition, message.offset)
      ) {
        console.log(
          `[AnalyticsService] Duplicate event detected, skipping: ${event.id}`
        );
        return;
      }

      // Validate the event
      const orderPlaced = OrderPlacedSchema.parse(event);

      console.log(
        `[AnalyticsService] Processing analytics for order: ${orderPlaced.data.orderId}`
      );

      // Update analytics
      this.updateProductStats(orderPlaced.data.items);
      this.totalOrders++;
      this.totalRevenue += orderPlaced.data.total;

      // Mark as processed
      this.idempotencyHandler.markProcessed(
        topic,
        partition,
        message.offset,
        event.id,
        event.correlationId
      );
    } catch (error) {
      console.error("[AnalyticsService] Error processing order:", error);
    }
  }

  private updateProductStats(
    items: Array<{ productId: string; quantity: number; price: number }>
  ) {
    for (const item of items) {
      const existing = this.productStats.get(item.productId);
      const itemRevenue = item.quantity * item.price;

      if (existing) {
        existing.count += item.quantity;
        existing.revenue += itemRevenue;
        existing.lastUpdated = new Date().toISOString();
      } else {
        this.productStats.set(item.productId, {
          productId: item.productId,
          count: item.quantity,
          revenue: itemRevenue,
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  }

  private startPeriodicSnapshots() {
    setInterval(async () => {
      await this.generateSnapshot();
    }, this.SNAPSHOT_INTERVAL_MS);

    console.log(
      `[AnalyticsService] Periodic snapshots scheduled every ${this.SNAPSHOT_INTERVAL_MS / 1000} seconds`
    );
  }

  private async generateSnapshot() {
    try {
      // Get top products by count
      const topProducts = Array.from(this.productStats.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 products

      const snapshotEvent: TopProductsUpdated = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        correlationId: uuidv4(),
        traceId: uuidv4(),
        version: "1.0.0",
        data: {
          top: topProducts.map((p) => ({
            productId: p.productId,
            count: p.count,
            revenue: p.revenue,
          })),
          period: "last_24h", // Simplified for demo
          ts: new Date().toISOString(),
        },
      };

      // Validate the event
      TopProductsUpdatedSchema.parse(snapshotEvent);

      // Publish to Kafka
      await this.producer.sendEvent("analytics.snapshots.v1", snapshotEvent);

      this.lastSnapshotTime = new Date().toISOString();
      console.log(
        `[AnalyticsService] Snapshot generated with ${topProducts.length} top products`
      );
    } catch (error) {
      console.error("[AnalyticsService] Error generating snapshot:", error);
    }
  }

  getAnalytics(
    period: string = "last_24h",
    limit: number = 10
  ): {
    topProducts: Array<{ productId: string; count: number; revenue: number }>;
    period: string;
    generatedAt: string;
    totalOrders: number;
    totalRevenue: number;
  } {
    const topProducts = Array.from(this.productStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((p) => ({
        productId: p.productId,
        count: p.count,
        revenue: p.revenue,
      }));

    return {
      topProducts,
      period,
      generatedAt: this.lastSnapshotTime,
      totalOrders: this.totalOrders,
      totalRevenue: this.totalRevenue,
    };
  }

  getProductStats(): Record<string, ProductStats> {
    return Object.fromEntries(this.productStats);
  }

  getStats(): { totalProcessed: number; maxSize: number } {
    return this.idempotencyHandler.getStats();
  }

  // Method to manually trigger snapshot generation
  async triggerSnapshot(): Promise<void> {
    await this.generateSnapshot();
  }
}
