import { Controller, Get } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly httpService: HttpService) {}

  @Get("metrics")
  async getMetrics() {
    try {
      const response = await firstValueFrom(
        this.httpService.get("http://localhost:3006/metrics/analytics")
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch analytics: ${errorMessage}`);
    }
  }
}
