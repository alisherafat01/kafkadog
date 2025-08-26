import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "up",
      service: "analytics-service",
      timestamp: new Date().toISOString(),
      message: "Analytics Service is running",
    };
  }
}
