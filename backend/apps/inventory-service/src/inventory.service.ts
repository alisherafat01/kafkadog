import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  KafkaConsumer,
  KafkaProducer,
  IdempotencyHandler,
  RetryHandler,
} from "@kafkadog/kafka";
import {
  OrderPlaced,
  InventoryReserved,
  InventoryRejected,
  OrderPlacedSchema,
  InventoryReservedSchema,
  InventoryRejectedSchema,
} from "@kafkadog/contracts";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class InventoryService implements OnModuleInit {
  private consumer: KafkaConsumer;
  private producer: KafkaProducer;
  private idempotencyHandler: IdempotencyHandler;
  private retryHandler: RetryHandler;

  // Mock inventory data for demo
  private inventory: Map<string, { available: number; reserved: number }> =
    new Map();

  constructor() {
    // Temporarily use environment variables directly to troubleshoot ConfigService injection
    const kafkaConfig = {
      brokers: process.env["KAFKA_BROKERS"]?.split(",") || ["localhost:9092"],
      clientId: process.env["KAFKA_CLIENT_ID"] || "inventory-service",
    };

    this.consumer = new KafkaConsumer(kafkaConfig, {
      groupId: "inventory-service-group",
      topics: ["orders.v1"],
    });

    this.producer = new KafkaProducer(kafkaConfig);
    this.idempotencyHandler = new IdempotencyHandler();

    this.retryHandler = new RetryHandler(this.producer, {
      maxAttempts: parseInt(process.env["KAFKA_RETRY_MAX_ATTEMPTS"] || "5"),
      baseDelayMs: parseInt(process.env["KAFKA_RETRY_BASE_DELAY_MS"] || "500"),
      maxDelayMs: 30000, // 30 seconds max
      retryTopic: "orders.retry.v1",
      dlqTopic: "orders.dlq.v1",
    });

    // Initialize mock inventory
    this.initializeMockInventory();
  }

  private initializeMockInventory() {
    const products = [
      "product-1",
      "product-2",
      "product-3",
      "product-4",
      "product-5",
    ];

    products.forEach((productId) => {
      this.inventory.set(productId, {
        available: Math.floor(Math.random() * 100) + 50, // 50-150 units
        reserved: 0,
      });
    });

    console.log(
      "[InventoryService] Mock inventory initialized:",
      Array.from(this.inventory.entries()).map(
        ([id, stock]) => `${id}: ${stock.available} available`
      )
    );
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe to order events
    await this.consumer.subscribe(async (payload) => {
      await this.handleOrderPlaced(payload);
    });

    console.log("[InventoryService] Started and listening for order events");
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
          `[InventoryService] Duplicate event detected, skipping: ${event.id}`
        );
        return;
      }

      // Validate the event
      const orderPlaced = OrderPlacedSchema.parse(event);

      console.log(
        `[InventoryService] Processing inventory for order: ${orderPlaced.data.orderId}`
      );

      // Process inventory reservation
      const inventoryResult = await this.processInventoryReservation(
        orderPlaced.data.orderId,
        orderPlaced.data.items
      );

      if (inventoryResult.success) {
        await this.publishInventoryReserved(
          orderPlaced,
          inventoryResult.reservations!
        );
      } else {
        await this.publishInventoryRejected(
          orderPlaced,
          inventoryResult.reason!
        );
      }

      // Mark as processed
      this.idempotencyHandler.markProcessed(
        topic,
        partition,
        message.offset,
        event.id,
        event.correlationId
      );
    } catch (error) {
      console.error("[InventoryService] Error processing order:", error);

      // Handle the error with retry mechanism
      try {
        const event = JSON.parse(payload.message.value.toString());
        await this.retryHandler.handleFailedEvent(event, error as Error, 0, {
          "x-correlation-id": event.correlationId,
          "x-trace-id": event.traceId,
        });
      } catch (retryError) {
        console.error("[InventoryService] Failed to handle retry:", retryError);
      }
    }
  }

  private async processInventoryReservation(
    _orderId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<{
    success: boolean;
    reservations?: Array<{
      productId: string;
      quantity: number;
      reservationId: string;
    }>;
    reason?: string;
  }> {
    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    // Simulate random failures for demo (20% failure rate)
    if (Math.random() < 0.2) {
      throw new Error("Simulated inventory service failure");
    }

    const reservations: Array<{
      productId: string;
      quantity: number;
      reservationId: string;
    }> = [];

    for (const item of items) {
      const stock = this.inventory.get(item.productId);
      if (!stock) {
        return {
          success: false,
          reason: `Product ${item.productId} not found in inventory`,
        };
      }

      if (stock.available < item.quantity) {
        return {
          success: false,
          reason: `Insufficient stock for product ${item.productId}. Available: ${stock.available}, Requested: ${item.quantity}`,
        };
      }

      // Reserve the inventory
      stock.available -= item.quantity;
      stock.reserved += item.quantity;

      reservations.push({
        productId: item.productId,
        quantity: item.quantity,
        reservationId: uuidv4(),
      });
    }

    return {
      success: true,
      reservations,
    };
  }

  private async publishInventoryReserved(
    orderPlaced: OrderPlaced,
    reservations: Array<{
      productId: string;
      quantity: number;
      reservationId: string;
    }>
  ) {
    const inventoryReservedEvent: InventoryReserved = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: orderPlaced.correlationId,
      traceId: orderPlaced.traceId,
      version: "1.0.0",
      data: {
        orderId: orderPlaced.data.orderId,
        items: reservations.map((r) => ({
          productId: r.productId,
          quantity: r.quantity,
          reservedAt: new Date().toISOString(),
        })),
        ts: new Date().toISOString(),
      },
    };

    // Validate the event
    InventoryReservedSchema.parse(inventoryReservedEvent);

    // Publish to Kafka with orderId as key for partitioning
    await this.producer.sendEvent(
      "inventory.v1",
      inventoryReservedEvent,
      orderPlaced.data.orderId
    );

    console.log(
      `[InventoryService] Inventory reserved for order ${orderPlaced.data.orderId}:`,
      reservations.length,
      "items"
    );
  }

  private async publishInventoryRejected(
    orderPlaced: OrderPlaced,
    reason: string
  ) {
    const inventoryRejectedEvent: InventoryRejected = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: orderPlaced.correlationId,
      traceId: orderPlaced.traceId,
      version: "1.0.0",
      data: {
        orderId: orderPlaced.data.orderId,
        items: [],
        reason,
        ts: new Date().toISOString(),
      },
    };

    // Validate the event
    InventoryRejectedSchema.parse(inventoryRejectedEvent);

    // Publish to Kafka with orderId as key for partitioning
    await this.producer.sendEvent(
      "inventory.v1",
      inventoryRejectedEvent,
      orderPlaced.data.orderId
    );

    console.log(
      `[InventoryService] Inventory rejected for order ${orderPlaced.data.orderId}: ${reason}`
    );
  }

  getInventoryStatus(): Record<
    string,
    { available: number; reserved: number }
  > {
    return Object.fromEntries(this.inventory);
  }

  getStats(): { totalProcessed: number; maxSize: number } {
    return this.idempotencyHandler.getStats();
  }
}
