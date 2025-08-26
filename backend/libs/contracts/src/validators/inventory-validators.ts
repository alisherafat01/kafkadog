import { z } from 'zod';

// Inventory Request Validation
export const InventoryRequestSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive integer')
  })).min(1, 'At least one item is required')
});

export type InventoryRequest = z.infer<typeof InventoryRequestSchema>;

// Inventory Item Validation
export const InventoryItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  reserved: z.number().int().min(0),
  available: z.number().int().min(0)
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// Reservation Status Validation
export const ReservationStatusSchema = z.enum([
  'PENDING',
  'RESERVED',
  'RELEASED',
  'EXPIRED'
]);

export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

