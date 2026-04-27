"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, MapPin, CreditCard } from "lucide-react";
import { ordersService } from "@/api/orders";
import { Button } from "@/components/common/Button";
import { OrderStatusBadge } from "@/components/common/Badge";
import { StatusTimeline } from "@/components/common/StatusTimeline";
import { Skeleton } from "@/components/common/Skeleton";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersService.cancelOrder(id),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
    onError: () => toast.error("Could not cancel order"),
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-500">Order not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  const storeName =
    typeof order.storeId === "object"
      ? order.storeId.storeIdentity?.name
      : null;
  const canCancel = order.status === "CREATED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Orders
        </button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
          {storeName && (
            <p className="text-sm text-gray-500 mt-0.5">from {storeName}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      <section className="rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-4 h-4" /> Items
        </h2>
        <div className="divide-y divide-gray-50">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-2.5 text-sm">
              <span className="text-gray-700">
                {item.productTitle} × {item.quantity}
              </span>
              <span className="font-medium text-gray-900">
                {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{order.pricing.subtotal.toFixed(2)}</span>
          </div>
          {order.pricing.tax > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>{order.pricing.tax.toFixed(2)}</span>
            </div>
          )}
          {order.pricing.shippingFee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>{order.pricing.shippingFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span>
            <span>{order.pricing.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Shipping address */}
      <section className="rounded-xl border border-gray-100 p-5 space-y-2">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Delivery Address
        </h2>
        <div className="text-sm text-gray-600 space-y-0.5">
          <p className="font-medium text-gray-900">
            {order.shippingAddress.fullName}
          </p>
          <p>{order.shippingAddress.addressLine1}</p>
          {order.shippingAddress.city && (
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.state &&
                `, ${order.shippingAddress.state}`}
            </p>
          )}
          <p>{order.shippingAddress.country}</p>
        </div>
        {order.trackingNumber && (
          <div className="mt-3 text-sm border-t border-gray-100 pt-3">
            <span className="text-gray-500">Tracking: </span>
            <span className="font-mono font-medium text-gray-900">
              {order.trackingNumber}
            </span>
            {order.carrier && (
              <span className="text-gray-500"> via {order.carrier}</span>
            )}
          </div>
        )}
      </section>

      {/* Status timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <section className="rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Status History
          </h2>
          <StatusTimeline entries={order.statusHistory} />
        </section>
      )}
    </div>
  );
}
