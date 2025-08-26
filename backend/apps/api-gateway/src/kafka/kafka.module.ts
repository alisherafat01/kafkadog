import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducer } from '@kafkadog/kafka';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KafkaProducer,
      useFactory: async (configService: ConfigService) => {
        const producer = new KafkaProducer({
          brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
          clientId: configService.get<string>('KAFKA_CLIENT_ID') || 'api-gateway',
          retryMaxAttempts: configService.get<number>('KAFKA_RETRY_MAX_ATTEMPTS') || 5,
          retryBaseDelayMs: configService.get<number>('KAFKA_RETRY_BASE_DELAY_MS') || 500,
        });

        await producer.connect();
        return producer;
      },
      inject: [ConfigService],
    },
  ],
  exports: [KafkaProducer],
})
export class KafkaModule {}

