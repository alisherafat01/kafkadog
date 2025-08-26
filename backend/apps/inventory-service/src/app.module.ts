import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { InventoryService } from "./inventory.service";
import { KafkaModule } from "./kafka/kafka.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "env.local",
    }),
    KafkaModule,
  ],
  controllers: [HealthController],
  providers: [InventoryService],
})
export class AppModule {}
