import { z } from "zod";

// OrderPlaced Event
export const OrderPlacedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    orderId: z.string().uuid(),
    userId: z.string(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive(),
        name: z.string().optional(),
      })
    ),
    total: z.number().positive(),
    ts: z.string().datetime(),
  }),
});

export type OrderPlaced = z.infer<typeof OrderPlacedSchema>;

// OrderCompleted Event
export const OrderCompletedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    orderId: z.string().uuid(),
    ts: z.string().datetime(),
  }),
});

export type OrderCompleted = z.infer<typeof OrderCompletedSchema>;

// OrderCancelled Event
export const OrderCancelledSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    orderId: z.string().uuid(),
    reason: z.string(),
    ts: z.string().datetime(),
  }),
});

export type OrderCancelled = z.infer<typeof OrderCancelledSchema>;

// Order Retry Event
export const OrderRetrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    originalEvent: z.any(), // The original event that failed
    retryCount: z.number().int().min(0),
    retryAt: z.string().datetime(),
    maxRetries: z.number().int().positive(),
    error: z.string(),
    ts: z.string().datetime(),
  }),
});

export type OrderRetry = z.infer<typeof OrderRetrySchema>;

// Order DLQ Event
export const OrderDLQSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    originalEvent: z.any(), // The original event that failed
    finalRetryCount: z.number().int().min(0),
    finalError: z.string(),
    failedAt: z.string().datetime(),
    ts: z.string().datetime(),
  }),
});

export type OrderDLQ = z.infer<typeof OrderDLQSchema>;
