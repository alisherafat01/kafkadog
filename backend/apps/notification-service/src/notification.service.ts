import { Injectable, OnModuleInit } from "@nestjs/common";
import { KafkaConsumer, IdempotencyHandler } from "@kafkadog/kafka";
import {
  OrderCompleted,
  OrderCancelled,
  OrderCompletedSchema,
  OrderCancelledSchema,
} from "@kafkadog/contracts";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class NotificationService implements OnModuleInit {
  private consumer: KafkaConsumer;
  private idempotencyHandler: IdempotencyHandler;
  private emailLogPath: string;

  constructor() {
    const kafkaConfig = {
      brokers: (process.env as Record<string, string | undefined>)[
        "KAFKA_BROKERS"
      ]?.split(",") || ["localhost:9092"],
      clientId:
        (process.env as Record<string, string | undefined>)[
          "KAFKA_CLIENT_ID"
        ] || "notification-service",
    };

    this.consumer = new KafkaConsumer(kafkaConfig, {
      groupId: "notification-service-group",
      topics: ["orders.outcome.v1"],
    });

    this.idempotencyHandler = new IdempotencyHandler();
    this.emailLogPath = path.join(process.cwd(), "outbox", "emails.log");

    // Ensure outbox directory exists
    this.ensureOutboxDirectory();
  }

  private ensureOutboxDirectory() {
    const outboxDir = path.dirname(this.emailLogPath);
    if (!fs.existsSync(outboxDir)) {
      fs.mkdirSync(outboxDir, { recursive: true });
    }
  }

  async onModuleInit() {
    await this.consumer.connect();

    // Subscribe to order outcome events
    await this.consumer.subscribe(async (payload) => {
      await this.handleOrderOutcome(payload);
    });

    console.log(
      "[NotificationService] Started and listening for order outcome events"
    );
  }

  private async handleOrderOutcome(payload: any) {
    try {
      const { topic, partition, message } = payload;
      const event = JSON.parse(message.value.toString());

      // Check idempotency
      if (
        this.idempotencyHandler.isDuplicate(topic, partition, message.offset)
      ) {
        console.log(
          `[NotificationService] Duplicate event detected, skipping: ${event.id}`
        );
        return;
      }

      console.log(
        `[NotificationService] Processing order outcome: ${event.id}`
      );

      // Determine event type and handle accordingly
      if (event.data.orderId) {
        if (event.data.reason) {
          // OrderCancelled event
          const orderCancelled = OrderCancelledSchema.parse(event);
          await this.handleOrderCancelled(orderCancelled);
        } else {
          // OrderCompleted event
          const orderCompleted = OrderCompletedSchema.parse(event);
          await this.handleOrderCompleted(orderCompleted);
        }
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
      console.error(
        "[NotificationService] Error processing order outcome:",
        error
      );
    }
  }

  private async handleOrderCompleted(event: OrderCompleted) {
    const emailContent = this.generateOrderCompletedEmail(event);
    await this.logEmailNotification(
      "order-completed",
      event.data.orderId,
      emailContent
    );

    console.log(
      `[NotificationService] Order completed email logged for order: ${event.data.orderId}`
    );
  }

  private async handleOrderCancelled(event: OrderCancelled) {
    const emailContent = this.generateOrderCancelledEmail(event);
    await this.logEmailNotification(
      "order-cancelled",
      event.data.orderId,
      emailContent
    );

    console.log(
      `[NotificationService] Order cancelled email logged for order: ${event.data.orderId}`
    );
  }

  private generateOrderCompletedEmail(event: OrderCompleted): string {
    return `
📧 EMAIL NOTIFICATION - ORDER COMPLETED

Order ID: ${event.data.orderId}
Status: COMPLETED
Timestamp: ${event.timestamp}
Correlation ID: ${event.correlationId}
Trace ID: ${event.traceId}

Dear Customer,

Your order has been successfully completed! 

We have processed your payment and reserved the inventory. Your order is now being prepared for shipment.

Thank you for your business!

Best regards,
The kafkadog Team

---
This is a demo email notification from the kafkadog learning project.
    `.trim();
  }

  private generateOrderCancelledEmail(event: OrderCancelled): string {
    return `
📧 EMAIL NOTIFICATION - ORDER CANCELLED

Order ID: ${event.data.orderId}
Status: CANCELLED
Reason: ${event.data.reason}
Timestamp: ${event.timestamp}
Correlation ID: ${event.correlationId}
Trace ID: ${event.traceId}

Dear Customer,

We regret to inform you that your order has been cancelled.

Reason: ${event.data.reason}

If you have any questions or would like to place a new order, please don't hesitate to contact our customer service team.

We apologize for any inconvenience this may have caused.

Best regards,
The kafkadog Team

---
This is a demo email notification from the kafkadog learning project.
    `.trim();
  }

  private async logEmailNotification(
    type: string,
    orderId: string,
    content: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()} - Order: ${orderId}\n${content}\n${"=".repeat(80)}\n\n`;

    try {
      fs.appendFileSync(this.emailLogPath, logEntry);
    } catch (error) {
      console.error("[NotificationService] Failed to write email log:", error);
    }
  }

  getEmailLogs(): string {
    try {
      if (fs.existsSync(this.emailLogPath)) {
        return fs.readFileSync(this.emailLogPath, "utf-8");
      }
      return "No email logs found.";
    } catch (error) {
      console.error("[NotificationService] Failed to read email logs:", error);
      return "Failed to read email logs.";
    }
  }

  getStats(): { totalProcessed: number; maxSize: number } {
    return this.idempotencyHandler.getStats();
  }
}
