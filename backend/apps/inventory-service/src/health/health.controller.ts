import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "up",
      service: "inventory-service",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("inventory")
  getInventoryStatus() {
    // Temporarily return mock data to avoid dependency injection issues
    return {
      "product-1": { available: 80, reserved: 0 },
      "product-2": { available: 57, reserved: 0 },
      "product-3": { available: 63, reserved: 0 },
      "product-4": { available: 104, reserved: 0 },
      "product-5": { available: 107, reserved: 0 },
    };
  }

  @Get("stats")
  getStats() {
    return {
      totalProcessed: 0,
      maxSize: 1000,
    };
  }
}
