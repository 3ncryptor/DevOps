import type { OrderStatus } from "./common";

export interface OrderAddress {
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface OrderPricing {
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  currency?: string;
}

export interface OrderStatusHistoryEntry {
  _id: string;
  status: OrderStatus;
  changedBy: string;
  actorRole: string;
  changedAt: string;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  storeId: string | { _id: string; storeIdentity: { name: string } };
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  pricing: OrderPricing;
  status: OrderStatus;
  statusHistory?: OrderStatusHistoryEntry[];
  notes?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
}

export interface ShipOrderPayload {
  trackingNumber: string;
  carrier: string;
}
