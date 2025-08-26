export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_AUTHORIZED = 'PAYMENT_AUTHORIZED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  INVENTORY_RESERVED = 'INVENTORY_RESERVED',
  INVENTORY_REJECTED = 'INVENTORY_REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export interface CreateOrderRequest {
  userId: string;
  items: OrderItem[];
}

export interface OrderState {
  orderId: string;
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'AUTHORIZED' | 'DECLINED';
  inventoryStatus?: 'PENDING' | 'RESERVED' | 'REJECTED';
  lastEvent?: string;
  lastEventTimestamp?: string;
}

