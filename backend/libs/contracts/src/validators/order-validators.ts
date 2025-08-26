import { z } from 'zod';

// Create Order Request Validation
export const CreateOrderRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    price: z.number().positive('Price must be positive'),
    name: z.string().optional()
  })).min(1, 'At least one item is required')
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// Order Item Validation
export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  name: z.string().optional()
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// Order Status Validation
export const OrderStatusSchema = z.enum([
  'PENDING',
  'PAYMENT_PROCESSING',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_DECLINED',
  'INVENTORY_RESERVED',
  'INVENTORY_REJECTED',
  'COMPLETED',
  'CANCELLED',
  'FAILED'
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

