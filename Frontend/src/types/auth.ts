import type { Role, AccountStatus } from "./common";

export interface AuthUser {
  _id: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: "USER" | "SELLER" | "SUPER_ADMIN";
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
