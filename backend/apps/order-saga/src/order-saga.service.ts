import { Injectable, OnModuleInit } from "@nestjs/common";
import { KafkaConsumer, KafkaProducer } from "@kafkadog/kafka";
import { v4 as uuidv4 } from "uuid";
import {
  OrderPlaced,
  PaymentAuthorized,
  PaymentDeclined,
  InventoryReserved,
  InventoryRejected,
} from "@kafkadog/contracts";

@Injectable()
export class OrderSagaService implements OnModuleInit {
  private consumer: KafkaConsumer;
  private producer: KafkaProducer;
  private orderStates = new Map<string, any>();

  constructor() {
    const kafkaConfig = {
      brokers: process.env["KAFKA_BROKERS"]?.split(",") || ["localhost:9092"],
      clientId: process.env["KAFKA_CLIENT_ID"] || "order-saga",
    };

    this.consumer = new KafkaConsumer(kafkaConfig, {
      groupId: "order-saga-group",
      topics: ["orders.v1", "payments.v1", "inventory.v1"],
    });

    this.producer = new KafkaProducer(kafkaConfig);
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe to all relevant events
    await this.consumer.subscribe(async (payload) => {
      await this.handleEvent(payload);
    });

    console.log("[OrderSagaService] Started and listening for events");
  }

  private async handleEvent(payload: any) {
    try {
      const { topic, message } = payload;
      const event = JSON.parse(message.value.toString());

      console.log(
        `[OrderSagaService] Processing event from topic ${topic}:`,
        event.id
      );

      // Route events based on topic
      switch (topic) {
        case "orders.v1":
          await this.handleOrderPlaced(event);
          break;
        case "payments.v1":
          await this.handlePaymentEvent(event);
          break;
        case "inventory.v1":
          await this.handleInventoryEvent(event);
          break;
        default:
          console.log(`[OrderSagaService] Unknown topic: ${topic}`);
      }
    } catch (error) {
      console.error("[OrderSagaService] Error handling event:", error);
    }
  }

  private async handleOrderPlaced(event: OrderPlaced) {
    const orderState: any = {
      orderId: event.data.orderId,
      userId: event.data.userId,
      items: event.data.items,
      total: event.data.total,
      paymentStatus: "PENDING",
      inventoryStatus: "PENDING",
      status: "PENDING",
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    };

    this.orderStates.set(event.data.orderId, orderState);
    console.log(
      `[OrderSagaService] Order ${event.data.orderId} placed, waiting for payment and inventory`
    );
  }

  private async handlePaymentEvent(event: PaymentAuthorized | PaymentDeclined) {
    const orderState = this.orderStates.get(event.data.orderId);
    if (!orderState) {
      console.log(
        `[OrderSagaService] Order state not found for: ${event.data.orderId}`
      );
      return;
    }

    if ("paymentId" in event.data) {
      // Payment authorized
      orderState.paymentStatus = "AUTHORIZED";
      orderState.updatedAt = new Date().toISOString();

      console.log(
        `[OrderSagaService] Payment authorized for order: ${event.data.orderId}`
      );

      // Check if both payment and inventory are ready
      if (orderState.inventoryStatus === "RESERVED") {
        orderState.status = "COMPLETED";
        orderState.updatedAt = new Date().toISOString();

        console.log(
          `[OrderSagaService] Order completed: ${event.data.orderId}`
        );

        // Publish OrderCompleted event
        const orderCompletedEvent: any = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          correlationId: event.correlationId,
          traceId: event.traceId,
          version: "1.0.0",
          data: {
            orderId: event.data.orderId,
            ts: new Date().toISOString(),
          },
        };

        await this.producer.sendEvent(
          "orders.completed.v1",
          orderCompletedEvent,
          event.data.orderId
        );
      }
    } else {
      // Payment declined
      orderState.paymentStatus = "DECLINED";
      orderState.status = "CANCELLED";
      orderState.updatedAt = new Date().toISOString();

      console.log(
        `[OrderSagaService] Payment declined for order: ${event.data.orderId}`
      );

      // Publish OrderCancelled event
      const orderCancelledEvent: any = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        correlationId: event.correlationId,
        traceId: event.traceId,
        version: "1.0.0",
        data: {
          orderId: event.data.orderId,
          reason: "Payment declined",
          ts: new Date().toISOString(),
        },
      };

      await this.producer.sendEvent(
        "orders.cancelled.v1",
        orderCancelledEvent,
        event.data.orderId
      );
    }
  }

  private async handleInventoryEvent(
    event: InventoryReserved | InventoryRejected
  ) {
    const orderState = this.orderStates.get(event.data.orderId);
    if (!orderState) {
      console.log(
        `[OrderSagaService] Order state not found for: ${event.data.orderId}`
      );
      return;
    }

    if ("items" in event.data && event.data.items.length > 0) {
      // Inventory reserved
      orderState.inventoryStatus = "RESERVED";
      orderState.updatedAt = new Date().toISOString();

      console.log(
        `[OrderSagaService] Inventory reserved for order: ${event.data.orderId}`
      );

      // Check if both payment and inventory are ready
      if (orderState.paymentStatus === "AUTHORIZED") {
        orderState.status = "COMPLETED";
        orderState.updatedAt = new Date().toISOString();

        console.log(
          `[OrderSagaService] Order completed: ${event.data.orderId}`
        );

        // Publish OrderCompleted event
        const orderCompletedEvent: any = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          correlationId: event.correlationId,
          traceId: event.traceId,
          version: "1.0.0",
          data: {
            orderId: event.data.orderId,
            ts: new Date().toISOString(),
          },
        };

        await this.producer.sendEvent(
          "orders.completed.v1",
          orderCompletedEvent,
          event.data.orderId
        );
      }
    } else {
      // Inventory rejected
      orderState.inventoryStatus = "REJECTED";
      orderState.status = "CANCELLED";
      orderState.updatedAt = new Date().toISOString();

      console.log(
        `[OrderSagaService] Inventory rejected for order: ${event.data.orderId}`
      );

      // Publish OrderCancelled event
      const orderCancelledEvent: any = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        correlationId: event.correlationId,
        traceId: event.traceId,
        version: "1.0.0",
        data: {
          orderId: event.data.orderId,
          reason: "Inventory rejected",
          ts: new Date().toISOString(),
        },
      };

      await this.producer.sendEvent(
        "orders.cancelled.v1",
        orderCancelledEvent,
        event.data.orderId
      );
    }
  }

  getOrderState(orderId: string): any | undefined {
    return this.orderStates.get(orderId);
  }

  getAllOrderStates(): any[] {
    return Array.from(this.orderStates.values());
  }

  getStats(): {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  } {
    const states = Array.from(this.orderStates.values());
    return {
      total: states.length,
      pending: states.filter((s) => s.status === "PENDING").length,
      completed: states.filter((s) => s.status === "COMPLETED").length,
      cancelled: states.filter((s) => s.status === "CANCELLED").length,
    };
  }

  // Method to check and fix stuck orders
  checkAndFixStuckOrders(): void {
    const states = Array.from(this.orderStates.values());
    let fixedCount = 0;

    for (const orderState of states) {
      if (
        orderState.status === "PENDING" &&
        orderState.paymentStatus === "AUTHORIZED" &&
        orderState.inventoryStatus === "RESERVED"
      ) {
        // This order should be completed
        orderState.status = "COMPLETED";
        orderState.updatedAt = new Date().toISOString();
        fixedCount++;

        console.log(
          `[OrderSagaService] Fixed stuck order: ${orderState.orderId}`
        );

        // Publish OrderCompleted event
        const orderCompletedEvent: any = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          correlationId: uuidv4(),
          traceId: uuidv4(),
          version: "1.0.0",
          data: {
            orderId: orderState.orderId,
            ts: new Date().toISOString(),
          },
        };

        this.producer
          .sendEvent(
            "orders.completed.v1",
            orderCompletedEvent,
            orderState.orderId
          )
          .catch((error) => {
            console.error(
              `[OrderSagaService] Error publishing completion event: ${error.message}`
            );
          });
      }
    }

    if (fixedCount > 0) {
      console.log(`[OrderSagaService] Fixed ${fixedCount} stuck orders`);
    }
  }
}
