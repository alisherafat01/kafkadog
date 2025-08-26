import { Controller, Get, Query } from "@nestjs/common";

@Controller("metrics")
export class MetricsController {
  @Get("analytics")
  getAnalytics(
    @Query("period") period: string = "last_24h",
    @Query("limit") limit: number = 10
  ) {
    // Temporarily return mock data to avoid dependency injection issues
    const mockProducts = [
      { productId: "product-1", count: 15, revenue: 1500 },
      { productId: "product-2", count: 12, revenue: 1200 },
      { productId: "product-3", count: 10, revenue: 1000 },
    ];

    return {
      topProducts: mockProducts.slice(0, limit),
      period: period,
      totalOrders: 37,
      totalRevenue: 3700,
    };
  }

  @Get("products")
  getProductStats() {
    // Temporarily return mock data
    return {
      "product-1": {
        count: 15,
        revenue: 1500,
        lastUpdated: new Date().toISOString(),
      },
      "product-2": {
        count: 12,
        revenue: 1200,
        lastUpdated: new Date().toISOString(),
      },
      "product-3": {
        count: 10,
        revenue: 1000,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  @Get("snapshot")
  async triggerSnapshot() {
    // Temporarily return mock response
    return { message: "Snapshot triggered successfully (mock response)" };
  }
}
