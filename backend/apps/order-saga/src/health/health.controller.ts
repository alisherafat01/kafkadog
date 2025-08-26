import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "up",
      service: "order-saga",
      timestamp: new Date().toISOString(),
      message: "Order Saga Service is running",
    };
  }
}
