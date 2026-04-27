"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package } from "lucide-react";
import { ordersService } from "@/api/orders";
import { OrderStatusBadge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import type { OrderStatus } from "@/types/common";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "CREATED", label: "Created" },
  { value: "PAID", label: "Paid" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, status],
    queryFn: () =>
      ordersService.getMyOrders({
        page,
        limit: 10,
        status: status || undefined,
      }),
  });

  const orders = data?.data?.orders ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setStatus(opt.value);
              setPage(1);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${status === opt.value ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title="No orders yet"
          description="Place your first order to see it here."
          action={
            <Link href="/">
              <button className="text-sm font-medium underline text-black">
                Browse products
              </button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const storeName =
              typeof order.storeId === "object"
                ? order.storeId.storeIdentity?.name
                : null;
            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-all hover:shadow-sm"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    #{order.orderNumber}
                  </p>
                  {storeName && (
                    <p className="text-xs text-gray-400">{storeName}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-sm font-bold text-gray-900">
                    {order.pricing.totalAmount.toFixed(2)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-6"
      />
    </div>
  );
}
