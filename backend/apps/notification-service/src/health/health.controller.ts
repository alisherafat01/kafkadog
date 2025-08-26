import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "up",
      service: "notification-service",
      timestamp: new Date().toISOString(),
      message: "Notification Service is running",
    };
  }
}
