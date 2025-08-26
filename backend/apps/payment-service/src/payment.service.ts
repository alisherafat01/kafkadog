import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  KafkaConsumer,
  KafkaProducer,
  IdempotencyHandler,
} from "@kafkadog/kafka";
import {
  OrderPlaced,
  PaymentAuthorized,
  PaymentDeclined,
  OrderPlacedSchema,
  PaymentAuthorizedSchema,
  PaymentDeclinedSchema,
} from "@kafkadog/contracts";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PaymentService implements OnModuleInit {
  private consumer: KafkaConsumer;
  private producer: KafkaProducer;
  private idempotencyHandler: IdempotencyHandler;

  constructor() {
    // Temporarily use environment variables directly to troubleshoot ConfigService injection
    const kafkaConfig = {
      brokers: process.env["KAFKA_BROKERS"]?.split(",") || ["localhost:9092"],
      clientId: process.env["KAFKA_CLIENT_ID"] || "payment-service",
    };

    this.consumer = new KafkaConsumer(kafkaConfig, {
      groupId: "payment-service-group",
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

    console.log("[PaymentService] Started and listening for order events");
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
          `[PaymentService] Duplicate event detected, skipping: ${event.id}`
        );
        return;
      }

      // Validate the event
      const orderPlaced = OrderPlacedSchema.parse(event);

      console.log(
        `[PaymentService] Processing payment for order: ${orderPlaced.data.orderId}`
      );

      // Simulate payment processing with random success/failure
      const paymentResult = await this.processPayment(
        orderPlaced.data.orderId,
        orderPlaced.data.total
      );

      if (paymentResult.success) {
        await this.publishPaymentAuthorized(
          orderPlaced,
          paymentResult.paymentId!
        );
      } else {
        await this.publishPaymentDeclined(orderPlaced, paymentResult.reason!);
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
      console.error("[PaymentService] Error processing order:", error);
    }
  }

  private async processPayment(
    _orderId: string,
    _amount: number
  ): Promise<{
    success: boolean;
    paymentId?: string;
    reason?: string;
  }> {
    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300)
    );

    // Simulate random failures for demo (15% failure rate)
    if (Math.random() < 0.15) {
      return {
        success: false,
        reason: "Simulated payment service failure",
      };
    }

    // Simulate payment processing
    const paymentId = uuidv4();
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        paymentId,
      };
    } else {
      return {
        success: false,
        reason: "Payment declined by bank",
      };
    }
  }

  private async publishPaymentAuthorized(
    orderPlaced: OrderPlaced,
    paymentId: string
  ) {
    const paymentAuthorizedEvent: PaymentAuthorized = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: orderPlaced.correlationId,
      traceId: orderPlaced.traceId,
      version: "1.0.0",
      data: {
        orderId: orderPlaced.data.orderId,
        paymentId,
        amount: orderPlaced.data.total,
        ts: new Date().toISOString(),
      },
    };

    // Validate the event
    PaymentAuthorizedSchema.parse(paymentAuthorizedEvent);

    // Publish to Kafka with orderId as key for partitioning
    await this.producer.sendEvent(
      "payments.v1",
      paymentAuthorizedEvent,
      orderPlaced.data.orderId
    );

    console.log(
      `[PaymentService] Payment authorized for order ${orderPlaced.data.orderId}: ${paymentId}`
    );
  }

  private async publishPaymentDeclined(
    orderPlaced: OrderPlaced,
    reason: string
  ) {
    const paymentDeclinedEvent: PaymentDeclined = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: orderPlaced.correlationId,
      traceId: orderPlaced.traceId,
      version: "1.0.0",
      data: {
        orderId: orderPlaced.data.orderId,
        reason,
        ts: new Date().toISOString(),
      },
    };

    // Validate the event
    PaymentDeclinedSchema.parse(paymentDeclinedEvent);

    // Publish to Kafka with orderId as key for partitioning
    await this.producer.sendEvent(
      "payments.v1",
      paymentDeclinedEvent,
      orderPlaced.data.orderId
    );

    console.log(
      `[PaymentService] Payment declined for order ${orderPlaced.data.orderId}: ${reason}`
    );
  }

  getStats(): { totalProcessed: number; maxSize: number } {
    return this.idempotencyHandler.getStats();
  }
}
