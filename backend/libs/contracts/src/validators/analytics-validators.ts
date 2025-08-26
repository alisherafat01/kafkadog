import { z } from 'zod';

// Analytics Metrics Request Validation
export const AnalyticsMetricsRequestSchema = z.object({
  period: z.enum(['last_1h', 'last_24h', 'last_7d', 'last_30d']).optional().default('last_24h'),
  limit: z.number().int().min(1).max(100).optional().default(10)
});

export type AnalyticsMetricsRequest = z.infer<typeof AnalyticsMetricsRequestSchema>;

// Top Product Validation
export const TopProductSchema = z.object({
  productId: z.string().min(1),
  count: z.number().int().min(0),
  revenue: z.number().positive()
});

export type TopProduct = z.infer<typeof TopProductSchema>;

// Analytics Response Validation
export const AnalyticsResponseSchema = z.object({
  topProducts: z.array(TopProductSchema),
  period: z.string(),
  generatedAt: z.string().datetime(),
  totalOrders: z.number().int().min(0),
  totalRevenue: z.number().positive()
});

export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>;

