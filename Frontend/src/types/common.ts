// ─── Common enums matching backend constants ────────────────────────────────

export type Role = "USER" | "SELLER" | "SUPER_ADMIN";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type SellerStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
export type StoreStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentStatus = "INITIATED" | "SUCCESS" | "FAILED" | "REFUNDED";
export type AddressType = "SHIPPING" | "BILLING";
export type AddressLabel = "HOME" | "WORK" | "OTHER";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type VerificationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";
export type DocumentType =
  | "GOVT_ID"
  | "BUSINESS_REGISTRATION"
  | "TAX_DOCUMENT"
  | "ADDRESS_PROOF"
  | "BANK_STATEMENT";
export type BusinessType = "INDIVIDUAL" | "COMPANY" | "PARTNERSHIP" | "OTHER";
export type AuthProvider = "LOCAL" | "GOOGLE" | "GITHUB";

// ─── Shared API shapes ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

/** Legacy mongoose-aggregate-paginate-v2 shape (kept for compatibility) */
export interface Paginated<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

/** Pagination metadata returned by the Zentra backend */
export interface BackendPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Generic paginated list response from the Zentra backend */
export type BackendList<K extends string, T> = Record<K, T[]> & {
  pagination: BackendPagination;
};
