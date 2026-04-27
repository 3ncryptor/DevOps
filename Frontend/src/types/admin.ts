import type { Role } from "./common";

export interface AdminUser {
  _id: string;
  email: string;
  role: Role;
  accountStatus: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  overview: {
    totalUsers: number;
    totalSellers: number;
    totalStores: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
  recent?: {
    orders: unknown[];
    users: unknown[];
  };
}

export interface AuditLog {
  _id: string;
  userId: string | { _id: string; email?: string; role?: Role };
  userRole?: Role;
  action: string;
  targetType: string;
  targetId?: string;
  details?: unknown;
  ipAddress?: string;
  createdAt: string;
}

export interface CategoryFormPayload {
  name: string;
  parentCategoryId?: string | null;
  sortOrder?: number;
}
