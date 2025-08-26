import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator
  ) {}

  @Get()
  check() {
    return {
      status: "up",
      service: "api-gateway",
      timestamp: new Date().toISOString(),
      message: "API Gateway is running",
    };
  }

  @Get("services")
  @HealthCheck()
  checkAllServices() {
    return this.health.check([
      () => this.http.pingCheck("order-saga", "http://localhost:3007/health"),
      () =>
        this.http.pingCheck("payment-service", "http://localhost:3003/health"),
      () =>
        this.http.pingCheck(
          "inventory-service",
          "http://localhost:3004/health"
        ),
      () =>
        this.http.pingCheck(
          "notification-service",
          "http://localhost:3005/health"
        ),
      () =>
        this.http.pingCheck(
          "analytics-service",
          "http://localhost:3006/health"
        ),
    ]);
  }
}
