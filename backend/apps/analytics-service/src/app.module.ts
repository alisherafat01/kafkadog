import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AnalyticsService } from "./analytics.service";
import { KafkaModule } from "./kafka/kafka.module";
import { HealthController } from "./health/health.controller";
import { MetricsController } from "./metrics/metrics.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "env.local",
    }),
    KafkaModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [AnalyticsService],
})
export class AppModule {}
