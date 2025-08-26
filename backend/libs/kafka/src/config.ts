import { KafkaConfig, ProducerConfig, ConsumerConfig } from "kafkajs";

export interface KafkaServiceConfig {
  brokers: string[];
  clientId: string;
  retryMaxAttempts?: number;
  retryBaseDelayMs?: number;
  connectionTimeout?: number;
  requestTimeout?: number;
}

export const createKafkaConfig = (config: KafkaServiceConfig): KafkaConfig => ({
  clientId: config.clientId,
  brokers: config.brokers,
  connectionTimeout: config.connectionTimeout || 3000,
  requestTimeout: config.requestTimeout || 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const createProducerConfig = (): ProducerConfig => ({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
  idempotent: true,
  maxInFlightRequests: 1,
});

export const createConsumerConfig = (groupId: string): ConsumerConfig => ({
  groupId,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  rebalanceTimeout: 60000,
  maxBytesPerPartition: 1048576, // 1MB
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const getKafkaConfigFromEnv = (): KafkaServiceConfig => ({
  brokers: (process.env as Record<string, string | undefined>)[
    "KAFKA_BROKERS"
  ]?.split(",") || ["localhost:9092"],
  clientId:
    (process.env as Record<string, string | undefined>)["KAFKA_CLIENT_ID"] ||
    "kafkadog",
  retryMaxAttempts: parseInt(
    (process.env as Record<string, string | undefined>)[
      "KAFKA_RETRY_MAX_ATTEMPTS"
    ] || "5"
  ),
  retryBaseDelayMs: parseInt(
    (process.env as Record<string, string | undefined>)[
      "KAFKA_RETRY_BASE_DELAY_MS"
    ] || "500"
  ),
  connectionTimeout: parseInt(
    (process.env as Record<string, string | undefined>)[
      "KAFKA_CONNECTION_TIMEOUT"
    ] || "3000"
  ),
  requestTimeout: parseInt(
    (process.env as Record<string, string | undefined>)[
      "KAFKA_REQUEST_TIMEOUT"
    ] || "30000"
  ),
});
