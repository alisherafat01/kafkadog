import { z } from 'zod';

// Payment Request Validation
export const PaymentRequestSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET']),
  userId: z.string().min(1, 'User ID is required')
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

// Payment Method Validation
export const PaymentMethodSchema = z.enum([
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'DIGITAL_WALLET'
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Payment Status Validation
export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'AUTHORIZED',
  'DECLINED',
  'FAILED'
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

