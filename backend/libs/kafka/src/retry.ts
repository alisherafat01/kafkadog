import { KafkaProducer } from "./producer";
import { BaseEvent, KafkaHeaders } from "@kafkadog/contracts";
import { v4 as uuidv4 } from "uuid";

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryTopic: string;
  dlqTopic: string;
}

export class RetryHandler {
  private producer: KafkaProducer;
  private config: RetryConfig;

  constructor(producer: KafkaProducer, config: RetryConfig) {
    this.producer = producer;
    this.config = config;
  }

  async handleFailedEvent(
    originalEvent: BaseEvent,
    error: Error,
    retryCount: number = 0,
    headers?: Partial<KafkaHeaders>
  ): Promise<void> {
    if (retryCount >= this.config.maxAttempts) {
      await this.sendToDLQ(originalEvent, error, retryCount, headers);
      return;
    }

    await this.scheduleRetry(originalEvent, error, retryCount, headers);
  }

  private async scheduleRetry(
    originalEvent: BaseEvent,
    error: Error,
    retryCount: number,
    headers?: Partial<KafkaHeaders>
  ): Promise<void> {
    const delay = this.calculateDelay(retryCount);
    const retryAt = new Date(Date.now() + delay);

    const retryEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: headers?.["x-correlation-id"] || uuidv4(),
      traceId: headers?.["x-trace-id"] || uuidv4(),
      version: "1.0.0",
      data: {
        originalEvent,
        retryCount: retryCount + 1,
        retryAt: retryAt.toISOString(),
        maxRetries: this.config.maxAttempts,
        error: error.message,
        ts: new Date().toISOString(),
      },
    };

    const retryHeaders = {
      ...headers,
      "x-retry-count": (retryCount + 1).toString(),
      "x-retry-at": retryAt.toISOString(),
    };

    // Schedule the retry by publishing to retry topic
    await this.producer.sendEvent(
      this.config.retryTopic,
      retryEvent,
      originalEvent.id, // Use original event ID as key for ordering
      retryHeaders
    );

    console.log(
      `[RetryHandler] Scheduled retry ${retryCount + 1}/${this.config.maxAttempts} for ${originalEvent.id} at ${retryAt.toISOString()}`
    );
  }

  private async sendToDLQ(
    originalEvent: BaseEvent,
    error: Error,
    finalRetryCount: number,
    headers?: Partial<KafkaHeaders>
  ): Promise<void> {
    const dlqEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      correlationId: headers?.["x-correlation-id"] || uuidv4(),
      traceId: headers?.["x-trace-id"] || uuidv4(),
      version: "1.0.0",
      data: {
        originalEvent,
        finalRetryCount,
        finalError: error.message,
        failedAt: new Date().toISOString(),
        ts: new Date().toISOString(),
      },
    };

    await this.producer.sendEvent(
      this.config.dlqTopic,
      dlqEvent,
      originalEvent.id,
      headers
    );

    console.error(
      `[RetryHandler] Event ${originalEvent.id} sent to DLQ after ${finalRetryCount} retry attempts. Error: ${error.message}`
    );
  }

  private calculateDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelayMs);

    return Math.floor(delay);
  }

  async processRetryEvent(
    retryEvent: any,
    handler: (event: BaseEvent) => Promise<void>
  ): Promise<void> {
    try {
      const originalEvent = retryEvent.data.originalEvent;
      console.log(
        `[RetryHandler] Processing retry event for ${originalEvent.id}, attempt ${retryEvent.data.retryCount}`
      );

      await handler(originalEvent);
      console.log(
        `[RetryHandler] Successfully processed retry event for ${originalEvent.id}`
      );
    } catch (error) {
      console.error(`[RetryHandler] Failed to process retry event:`, error);

      // Schedule next retry if we haven't exceeded max attempts
      if (retryEvent.data.retryCount < retryEvent.data.maxRetries) {
        await this.handleFailedEvent(
          retryEvent.data.originalEvent,
          error as Error,
          retryEvent.data.retryCount,
          {
            "x-correlation-id": retryEvent.correlationId,
            "x-trace-id": retryEvent.traceId,
          }
        );
      } else {
        await this.sendToDLQ(
          retryEvent.data.originalEvent,
          error as Error,
          retryEvent.data.retryCount,
          {
            "x-correlation-id": retryEvent.correlationId,
            "x-trace-id": retryEvent.traceId,
          }
        );
      }
    }
  }
}
