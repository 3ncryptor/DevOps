"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import { cartService } from "@/api/cart";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";

export default function CartPage() {
  const queryClient = useQueryClient();
  const { setCount } = useCartStore();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getCart,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartService.updateItem(productId, quantity),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
      setCount(res.data?.items?.length ?? 0);
    },
    onError: () => toast.error("Could not update cart"),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess: (res) => {
      queryClient.setQueryData(["cart"], res);
      setCount(res.data?.items?.length ?? 0);
      toast.success("Item removed");
    },
  });

  const clearMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setCount(0);
      toast.success("Cart cleared");
    },
  });

  const cart = data?.data;
  const items = cart?.items ?? [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => clearMutation.mutate()}
            isLoading={clearMutation.isPending}
          >
            Clear All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-16 h-16" />}
          title="Your cart is empty"
          description="Browse our marketplace and add products to get started."
          action={
            <Link href="/">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const p = item.productId;
              const price =
                typeof p === "object"
                  ? p.pricing?.[p.pricing.length - 1]
                  : null;
              const img = typeof p === "object" ? p.images?.[0]?.url : null;
              const title =
                typeof p === "object" ? p.identity?.title : "Product";
              const productId = typeof p === "object" ? p._id : String(p);

              return (
                <div
                  key={productId}
                  className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white"
                >
                  <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-300">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {title}
                    </p>
                    {price && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {price.currency} {price.price.toFixed(2)} each
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          className="px-2.5 py-1 hover:bg-gray-50 disabled:opacity-40"
                          disabled={
                            item.quantity <= 1 || updateMutation.isPending
                          }
                          onClick={() =>
                            updateMutation.mutate({
                              productId,
                              quantity: item.quantity - 1,
                            })
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm font-medium border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          className="px-2.5 py-1 hover:bg-gray-50 disabled:opacity-40"
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              productId,
                              quantity: item.quantity + 1,
                            })
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        className="text-red-400 hover:text-red-600 transition-colors"
                        onClick={() => removeMutation.mutate(productId)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {price && (
                    <p className="text-sm font-bold text-gray-900 shrink-0">
                      {price.currency}{" "}
                      {(price.price * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Order Summary</h2>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Items ({items.length})</span>
                  <span className="font-medium text-gray-900">
                    {cart?.summary?.subtotal != null
                      ? `${cart.summary.currency} ${cart.summary.subtotal.toFixed(2)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                  <span>Total</span>
                  <span>
                    {cart?.summary?.subtotal != null
                      ? `${cart.summary.currency} ${cart.summary.subtotal.toFixed(2)}`
                      : "—"}
                  </span>
                </div>
              </div>
              <Link href="/checkout">
                <Button className="w-full" size="lg">
                  Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
