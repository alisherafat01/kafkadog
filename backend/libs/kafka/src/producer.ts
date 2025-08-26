import { Kafka, Producer, ProducerRecord, Message } from "kafkajs";
import {
  createKafkaConfig,
  createProducerConfig,
  KafkaServiceConfig,
} from "./config";
import { createKafkaHeaders, createEventMetadata } from "./headers";
import { BaseEvent, KafkaHeaders } from "@kafkadog/contracts";

export class KafkaProducer {
  private producer: Producer;
  private config: KafkaServiceConfig;

  constructor(config: KafkaServiceConfig) {
    this.config = config;
    const kafka = new Kafka(createKafkaConfig(config));
    this.producer = kafka.producer(createProducerConfig());
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log(`[${this.config.clientId}] Producer connected`);
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to connect producer:`,
        error
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log(`[${this.config.clientId}] Producer disconnected`);
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to disconnect producer:`,
        error
      );
      throw error;
    }
  }

  async sendEvent<T extends BaseEvent>(
    topic: string,
    event: T,
    key?: string,
    headers?: Partial<KafkaHeaders>
  ): Promise<void> {
    try {
      const message: Message = {
        key: key ? Buffer.from(key) : null,
        value: Buffer.from(JSON.stringify(event)),
        headers: {
          ...createKafkaHeaders(
            createEventMetadata(this.config.clientId),
            event.constructor.name,
            event.id
          ),
          ...headers,
        },
      };

      const record: ProducerRecord = {
        topic,
        messages: [message],
      };

      await this.producer.send(record);
      console.log(
        `[${this.config.clientId}] Event sent to ${topic}:`,
        event.id
      );
    } catch (error) {
      console.error(
        `[${this.config.clientId}] Failed to send event to ${topic}:`,
        error
      );
      throw error;
    }
  }

  async sendBatch(records: ProducerRecord[]): Promise<void> {
    try {
      // Send records one by one since sendBatch expects ProducerBatch
      for (const record of records) {
        await this.producer.send(record);
      }
      console.log(
        `[${this.config.clientId}] Batch sent:`,
        records.length,
        "records"
      );
    } catch (error) {
      console.error(`[${this.config.clientId}] Failed to send batch:`, error);
      throw error;
    }
  }

  async sendWithRetry<T extends BaseEvent>(
    topic: string,
    event: T,
    key?: string,
    headers?: Partial<KafkaHeaders>,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.sendEvent(topic, event, key, headers);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(
            `[${this.config.clientId}] Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}
