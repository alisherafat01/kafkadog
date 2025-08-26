export interface BaseEvent {
  id: string;
  timestamp: string;
  correlationId: string;
  traceId: string;
  version: string;
}

export interface EventMetadata {
  correlationId: string;
  traceId: string;
  userId?: string;
  source: string;
  timestamp: string;
}

export interface KafkaHeaders {
  'x-correlation-id': string;
  'x-trace-id': string;
  'x-event-id': string;
  'x-event-type': string;
  'x-source': string;
  'x-timestamp': string;
  'x-retry-count'?: string;
  'x-retry-at'?: string;
}

export interface RetryMetadata {
  retryCount: number;
  retryAt: string;
  maxRetries: number;
  baseDelayMs: number;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, any>;
}

