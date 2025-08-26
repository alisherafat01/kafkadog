import { Controller, Get, Param, Post } from "@nestjs/common";
import { OrderSagaService } from "./order-saga.service";

@Controller("order-saga")
export class OrderSagaController {
  constructor(private readonly orderSagaService: OrderSagaService) {}

  @Get("orders")
  async getOrders() {
    return this.orderSagaService.getAllOrderStates();
  }

  @Get("orders/:orderId")
  async getOrder(@Param("orderId") orderId: string) {
    return this.orderSagaService.getOrderState(orderId);
  }

  @Get("stats")
  async getStats() {
    return this.orderSagaService.getStats();
  }

  @Post("fix-stuck-orders")
  async fixStuckOrders() {
    this.orderSagaService.checkAndFixStuckOrders();
    return { message: "Stuck orders check completed" };
  }
}
