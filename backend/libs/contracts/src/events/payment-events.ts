import { z } from 'zod';

// PaymentAuthorized Event
export const PaymentAuthorizedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal('1.0.0'),
  data: z.object({
    orderId: z.string().uuid(),
    paymentId: z.string().uuid(),
    amount: z.number().positive(),
    ts: z.string().datetime()
  })
});

export type PaymentAuthorized = z.infer<typeof PaymentAuthorizedSchema>;

// PaymentDeclined Event
export const PaymentDeclinedSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  correlationId: z.string().uuid(),
  traceId: z.string().uuid(),
  version: z.literal('1.0.0'),
  data: z.object({
    orderId: z.string().uuid(),
    reason: z.string(),
    ts: z.string().datetime()
  })
});

export type PaymentDeclined = z.infer<typeof PaymentDeclinedSchema>;

