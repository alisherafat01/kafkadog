import { KafkaHeaders, EventMetadata } from "@kafkadog/contracts";
import { v4 as uuidv4 } from "uuid";

export const createEventMetadata = (
  source: string,
  userId?: string
): EventMetadata => {
  const metadata: EventMetadata = {
    correlationId: uuidv4(),
    traceId: uuidv4(),
    source,
    timestamp: new Date().toISOString(),
  };

  if (userId !== undefined) {
    metadata.userId = userId;
  }

  return metadata;
};

export const createKafkaHeaders = (
  metadata: EventMetadata,
  eventType: string,
  eventId: string,
  retryCount?: number,
  retryAt?: string
): KafkaHeaders => {
  const headers: KafkaHeaders = {
    "x-correlation-id": metadata.correlationId,
    "x-trace-id": metadata.traceId,
    "x-event-id": eventId,
    "x-event-type": eventType,
    "x-source": metadata.source,
    "x-timestamp": metadata.timestamp,
  };

  if (retryCount !== undefined) {
    headers["x-retry-count"] = retryCount.toString();
  }

  if (retryAt) {
    headers["x-retry-at"] = retryAt;
  }

  return headers;
};

export const extractMetadataFromHeaders = (
  headers: Record<string, any>
): Partial<EventMetadata> => ({
  correlationId: headers["x-correlation-id"],
  traceId: headers["x-trace-id"],
  userId: headers["x-user-id"],
  source: headers["x-source"],
  timestamp: headers["x-timestamp"],
});

export const getRetryInfoFromHeaders = (
  headers: Record<string, any>
): { retryCount: number; retryAt?: string } => ({
  retryCount: parseInt(headers["x-retry-count"] || "0"),
  retryAt: headers["x-retry-at"],
});

export const propagateHeaders = (
  headers: Record<string, any>
): Record<string, any> => {
  const propagatedHeaders: Record<string, any> = {};

  // Propagate tracing headers
  ["x-correlation-id", "x-trace-id", "x-source"].forEach((key) => {
    if (headers[key]) {
      propagatedHeaders[key] = headers[key];
    }
  });

  return propagatedHeaders;
};
