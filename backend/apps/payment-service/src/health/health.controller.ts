import { Controller, Get } from "@nestjs/common";
import { PaymentService } from "../payment.service";

@Controller("health")
export class HealthController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  check() {
    return {
      status: "up",
      service: "payment-service",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("stats")
  getStats() {
    return this.paymentService.getStats();
  }
}
