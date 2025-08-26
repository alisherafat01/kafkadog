import { z } from "zod";

// InventoryReserved Event
export const InventoryReservedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    orderId: z.string().uuid(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        reservedAt: z.string().datetime(),
      })
    ),
    ts: z.string().datetime(),
  }),
});

export type InventoryReserved = z.infer<typeof InventoryReservedSchema>;

// InventoryRejected Event
export const InventoryRejectedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    orderId: z.string().uuid(),
    reason: z.string(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        availableQuantity: z.number().int().min(0),
      })
    ),
    ts: z.string().datetime(),
  }),
});

export type InventoryRejected = z.infer<typeof InventoryRejectedSchema>;

// InventoryReleased Event
export const InventoryReleasedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal("1.0.0"),
  data: z.object({
    orderId: z.string().uuid(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        releasedAt: z.string().datetime(),
      })
    ),
    ts: z.string().datetime(),
  }),
});

export type InventoryReleased = z.infer<typeof InventoryReleasedSchema>;
