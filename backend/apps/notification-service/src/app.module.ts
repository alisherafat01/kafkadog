import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { NotificationService } from "./notification.service";
import { KafkaModule } from "./kafka/kafka.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "env.local",
    }),
    TerminusModule,
    KafkaModule,
  ],
  controllers: [HealthController],
  providers: [NotificationService],
})
export class AppModule {}
