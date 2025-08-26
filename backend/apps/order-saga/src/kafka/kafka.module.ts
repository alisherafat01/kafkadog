import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducer, KafkaConsumer } from '@kafkadog/kafka';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KafkaProducer,
      useFactory: async (configService: ConfigService) => {
        const producer = new KafkaProducer({
          brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
          clientId: configService.get<string>('KAFKA_CLIENT_ID') || 'order-saga',
          retryMaxAttempts: configService.get<number>('KAFKA_RETRY_MAX_ATTEMPTS') || 5,
          retryBaseDelayMs: configService.get<number>('KAFKA_RETRY_BASE_DELAY_MS') || 500,
        });

        await producer.connect();
        return producer;
      },
      inject: [ConfigService],
    },
    {
      provide: KafkaConsumer,
      useFactory: async (configService: ConfigService) => {
        const consumer = new KafkaConsumer({
          brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
          clientId: configService.get<string>('KAFKA_CLIENT_ID') || 'order-saga',
          retryMaxAttempts: configService.get<number>('KAFKA_RETRY_MAX_ATTEMPTS') || 5,
          retryBaseDelayMs: configService.get<number>('KAFKA_RETRY_BASE_DELAY_MS') || 500,
        }, {
          groupId: 'order-saga-group',
          topics: ['orders.v1', 'payments.v1', 'inventory.v1']
        });

        await consumer.connect();
        return consumer;
      },
      inject: [ConfigService],
    },
  ],
  exports: [KafkaProducer, KafkaConsumer],
})
export class KafkaModule {}

