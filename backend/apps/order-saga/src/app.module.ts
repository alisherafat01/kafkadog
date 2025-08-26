import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { OrderSagaService } from "./order-saga.service";
import { KafkaModule } from "./kafka/kafka.module";
import { HealthController } from "./health/health.controller";
import { OrderSagaController } from "./order-saga.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "env.local",
    }),
    TerminusModule,
    KafkaModule,
  ],
  controllers: [HealthController, OrderSagaController],
  providers: [OrderSagaService],
})
export class AppModule {}
