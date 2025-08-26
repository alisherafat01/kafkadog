import { z } from 'zod';

// TopProductsUpdated Event
export const TopProductsUpdatedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal('1.0.0'),
  data: z.object({
    top: z.array(z.object({
      productId: z.string(),
      count: z.number().int().min(0),
      revenue: z.number().positive()
    })),
    period: z.string(), // e.g., "last_24h", "last_7d"
    ts: z.string().datetime()
  })
});

export type TopProductsUpdated = z.infer<typeof TopProductsUpdatedSchema>;

// PageView Event
export const PageViewSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal('1.0.0'),
  data: z.object({
    page: z.string(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    userAgent: z.string().optional(),
    ts: z.string().datetime()
  })
});

export type PageView = z.infer<typeof PageViewSchema>;

