import type { PaymentStatus } from "./common";

export interface Payment {
  _id: string;
  orderId: string;
  userId: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentPayload {
  orderId: string;
  provider?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
}
