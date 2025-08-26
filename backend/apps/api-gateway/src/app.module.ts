import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { HttpModule } from "@nestjs/axios";
import { OrdersController } from "./orders/orders.controller";
import { OrdersService } from "./orders/orders.service";
import { KafkaModule } from "./kafka/kafka.module";
import { HealthController } from "./health/health.controller";
import { AnalyticsController } from "./analytics/analytics.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "env.local",
    }),
    TerminusModule,
    HttpModule,
    KafkaModule,
  ],
  controllers: [OrdersController, HealthController, AnalyticsController],
  providers: [OrdersService],
})
export class AppModule {}
