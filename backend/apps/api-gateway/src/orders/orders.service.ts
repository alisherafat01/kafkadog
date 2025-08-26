import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { KafkaProducer } from "@kafkadog/kafka";
import {
  CreateOrderRequest,
  OrderPlaced,
  OrderPlacedSchema,
} from "@kafkadog/contracts";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class OrdersService {
  constructor(private readonly kafkaProducer: KafkaProducer) {}

  async createOrder(
    createOrderDto: CreateOrderRequest
  ): Promise<{ orderId: string }> {
    const orderId = uuidv4();
    const total = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create OrderPlaced event
    const orderPlacedEvent: OrderPlaced = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: uuidv4(),
      traceId: uuidv4(),
      version: "1.0.0",
      data: {
        orderId,
        userId: createOrderDto.userId,
        items: createOrderDto.items,
        total,
        ts: new Date().toISOString(),
      },
    };

    // Validate the event
    OrderPlacedSchema.parse(orderPlacedEvent);

    // Publish to Kafka with orderId as key for partitioning
    await this.kafkaProducer.sendEvent("orders.v1", orderPlacedEvent, orderId);

    console.log(`[OrdersService] Order created: ${orderId}, total: ${total}`);

    return { orderId };
  }

  private async fetchFromOrderSaga(endpoint: string): Promise<any> {
    try {
      const orderSagaUrl =
        process.env["ORDER_SAGA_URL"] || "http://localhost:3002";
      const response = await fetch(`${orderSagaUrl}/${endpoint}`);

      if (!response.ok) {
        throw new Error(
          `Order saga service responded with status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[OrdersService] Error fetching from order saga: ${errorMessage}`
      );
      throw new HttpException(
        "Failed to fetch order data from order saga service",
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      return await this.fetchFromOrderSaga(`order-saga/orders/${orderId}`);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // If order not found, return a placeholder
      return {
        orderId,
        status: "PENDING",
        message:
          "Order status will be available once processed by order saga service",
      };
    }
  }

  async getOrders(): Promise<any[]> {
    try {
      const orders = await this.fetchFromOrderSaga("order-saga/orders");
      return orders.length > 0
        ? orders
        : [
            {
              message:
                "No orders found. Create your first order to see it here!",
            },
          ];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Fallback to placeholder if order saga service is unavailable
      return [
        {
          message:
            "Order saga service is starting up. Please try again in a moment.",
        },
      ];
    }
  }
}
