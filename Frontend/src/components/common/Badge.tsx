import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        purple: "bg-purple-100 text-purple-800",
        outline: "border border-gray-300 text-gray-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// ─── Status badge helpers ────────────────────────────────────────────────────

type StatusMap = Record<string, VariantProps<typeof badgeVariants>["variant"]>;

const ORDER_STATUS_MAP: StatusMap = {
  CREATED: "info",
  PAID: "success",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "purple",
};

const PRODUCT_STATUS_MAP: StatusMap = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

const SELLER_STATUS_MAP: StatusMap = {
  PENDING: "warning",
  APPROVED: "success",
  SUSPENDED: "error",
  REJECTED: "error",
};

const PAYMENT_STATUS_MAP: StatusMap = {
  INITIATED: "info",
  SUCCESS: "success",
  FAILED: "error",
  REFUNDED: "purple",
};

const ACCOUNT_STATUS_MAP: StatusMap = {
  ACTIVE: "success",
  SUSPENDED: "error",
  DELETED: "default",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ORDER_STATUS_MAP[status] ?? "default"}>{status}</Badge>
  );
}

export function ProductStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={PRODUCT_STATUS_MAP[status] ?? "default"}>{status}</Badge>
  );
}

export function SellerStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={SELLER_STATUS_MAP[status] ?? "default"}>{status}</Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={PAYMENT_STATUS_MAP[status] ?? "default"}>{status}</Badge>
  );
}

export function AccountStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ACCOUNT_STATUS_MAP[status] ?? "default"}>{status}</Badge>
  );
}
