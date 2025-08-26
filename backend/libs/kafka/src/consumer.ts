import {
  Kafka,
  Consumer,
  ConsumerSubscribeTopics,
  EachMessagePayload,
  EachBatchPayload,
} from "kafkajs";
import {
  createKafkaConfig,
  createConsumerConfig,
  KafkaServiceConfig,
} from "./config";
import { extractMetadataFromHeaders } from "./headers";

export interface ConsumerOptions {
  groupId: string;
  topics: string[];
  autoCommit?: boolean;
  autoCommitInterval?: number;
  autoCommitThreshold?: number;
}

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;
export type BatchHandler = (payload: EachBatchPayload) => Promise<void>;

export class KafkaConsumer {
  private consumer: Consumer;
  private config: KafkaServiceConfig;
  private options: ConsumerOptions;

  constructor(config: KafkaServiceConfig, options: ConsumerOptions) {
    this.config = config;
    this.options = options;
    const kafka = new Kafka(createKafkaConfig(config));
    this.consumer = kafka.consumer(createConsumerConfig(options.groupId));
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log(
        `[${this.config.clientId}] Consumer connected to group: ${this.options.groupId}`
      );
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to connect consumer:`,
        error
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log(
        `[${this.config.clientId}] Consumer disconnected from group: ${this.options.groupId}`
      );
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to disconnect consumer:`,
        error
      );
      throw error;
    }
  }

  async subscribe(handler: MessageHandler): Promise<void> {
    try {
      const topics: ConsumerSubscribeTopics = {
        topics: this.options.topics,
        fromBeginning: false,
      };

      await this.consumer.subscribe(topics);

      await this.consumer.run({
        autoCommit: this.options.autoCommit ?? true,
        autoCommitInterval: this.options.autoCommitInterval ?? 5000,
        autoCommitThreshold: this.options.autoCommitThreshold ?? 100,
        eachMessage: async (payload) => {
          try {
            const metadata = extractMetadataFromHeaders(
              payload.message.headers || {}
            );
            console.log(
              `[${this.config.clientId}] Processing message from ${payload.topic}[${payload.partition}]:${payload.message.offset}`,
              {
                correlationId: metadata.correlationId,
                traceId: metadata.traceId,
              }
            );

            await handler(payload);
          } catch (error) {
            console.error(
              `[${this.config.clientId}] Error processing message:`,
              error
            );
            // In production, you might want to send to DLQ here
            throw error;
          }
        },
      });

      console.log(
        `[${this.config.clientId}] Consumer subscribed to topics:`,
        this.options.topics
      );
    } catch (error) {
      console.error(`[${this.config.clientId}] Failed to subscribe:`, error);
      throw error;
    }
  }

  async subscribeBatch(handler: BatchHandler): Promise<void> {
    try {
      const topics: ConsumerSubscribeTopics = {
        topics: this.options.topics,
        fromBeginning: false,
      };

      await this.consumer.subscribe(topics);

      await this.consumer.run({
        autoCommit: this.options.autoCommit ?? true,
        autoCommitInterval: this.options.autoCommitInterval ?? 5000,
        autoCommitThreshold: this.options.autoCommitThreshold ?? 100,
        eachBatch: async (payload) => {
          try {
            console.log(
              `[${this.config.clientId}] Processing batch from ${payload.batch.messages.length} messages`
            );
            await handler(payload);
          } catch (error) {
            console.error(
              `[${this.config.clientId}] Error processing batch:`,
              error
            );
            throw error;
          }
        },
      });

      console.log(
        `[${this.config.clientId}] Consumer subscribed to topics (batch mode):`,
        this.options.topics
      );
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to subscribe batch:`,
        error
      );
      throw error;
    }
  }

  async pause(
    topics: Array<{ topic: string; partitions?: number[] }>
  ): Promise<void> {
    try {
      await this.consumer.pause(topics);
      console.log(
        `[${this.config.clientId}] Consumer paused for topics:`,
        topics
      );
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to pause consumer:`,
        error
      );
      throw error;
    }
  }

  async resume(
    topics: Array<{ topic: string; partitions?: number[] }>
  ): Promise<void> {
    try {
      await this.consumer.resume(topics);
      console.log(
        `[${this.config.clientId}] Consumer resumed for topics:`,
        topics
      );
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to resume consumer:`,
        error
      );
      throw error;
    }
  }

  async commitOffsets(
    offsets: Array<{ topic: string; partition: number; offset: string }>
  ): Promise<void> {
    try {
      await this.consumer.commitOffsets(offsets);
      console.log(`[${this.config.clientId}] Committed offsets:`, offsets);
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to commit offsets:`,
        error
      );
      throw error;
    }
  }
}
