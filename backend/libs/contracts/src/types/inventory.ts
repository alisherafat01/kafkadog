export interface InventoryItem {
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED'
}

export interface InventoryRequest {
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface InventoryResult {
  success: boolean;
  reservations?: Array<{
    productId: string;
    quantity: number;
    reservationId: string;
  }>;
  error?: string;
  reason?: string;
}

