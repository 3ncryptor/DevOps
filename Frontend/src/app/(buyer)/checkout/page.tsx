"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MapPin, Plus, CreditCard, CheckCircle } from "lucide-react";
import { cartService } from "@/api/cart";
import { usersService } from "@/api/users";
import { ordersService } from "@/api/orders";
import { paymentsService } from "@/api/payments";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { useCartStore } from "@/store/useCartStore";
import type { Address, CreateAddressPayload } from "@/types/user";
import type { CreateOrderPayload } from "@/types/order";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { reset: resetCart } = useCartStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<CreateAddressPayload>>({
    type: "SHIPPING",
    label: "HOME",
    recipient: { fullName: "" },
    addressLine1: "",
    country: "US",
  });

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getCart,
  });

  const {
    data: addressesData,
    isLoading: addrLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: usersService.getAddresses,
  });

  const addAddressMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      usersService.addAddress(payload),
    onSuccess: (res) => {
      refetchAddresses();
      setSelectedAddressId(res.data._id);
      setShowAddressModal(false);
      toast.success("Address added");
    },
    onError: () => toast.error("Failed to add address"),
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const orderRes = await ordersService.createOrder(payload);
      const orders = orderRes.data;
      if (orders?.length) {
        try {
          await paymentsService.quickPay(orders[0]._id);
        } catch {}
      }
      return orders;
    },
    onSuccess: (orders) => {
      resetCart();
      toast.success("Order placed successfully!");
      if (orders?.length) {
        router.push(`/orders/${orders[0]._id}`);
      } else {
        router.push("/orders");
      }
    },
    onError: () => toast.error("Failed to place order"),
  });

  const addresses = addressesData?.data ?? [];
  const cart = cartData?.data;
  const items = cart?.items ?? [];

  const selectedAddress =
    addresses.find((a) => a._id === selectedAddressId) ?? addresses[0];

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const payload: CreateOrderPayload = {
      shippingAddress: {
        fullName: selectedAddress.recipient.fullName,
        phone: selectedAddress.recipient.phoneNumber,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
      },
    };
    placeOrderMutation.mutate(payload);
  };

  if (cartLoading || addrLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="space-y-6">
        {/* Delivery address */}
        <section className="rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Delivery Address
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddressModal(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No addresses yet. Add one to continue.
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr: Address) => (
                <label
                  key={addr._id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAddressId === addr._id || (!selectedAddressId && addr.isDefault) ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr._id}
                    checked={
                      selectedAddressId === addr._id ||
                      (!selectedAddressId && addr.isDefault)
                    }
                    onChange={() => setSelectedAddressId(addr._id)}
                    className="mt-0.5 h-4 w-4 accent-black"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {addr.recipient.fullName}
                    </p>
                    <p className="text-gray-500">
                      {addr.addressLine1}
                      {addr.city && `, ${addr.city}`}
                      {addr.country && `, ${addr.country}`}
                    </p>
                    {addr.isDefault && (
                      <span className="text-xs text-black font-medium">
                        Default
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Order summary */}
        <section className="rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Order Summary
          </h2>
          <div className="space-y-2">
            {items.map((item) => {
              const p = item.productId;
              const price =
                typeof p === "object"
                  ? p.pricing?.[p.pricing.length - 1]
                  : null;
              const title =
                typeof p === "object" ? p.identity?.title : "Product";
              return (
                <div
                  key={typeof p === "object" ? p._id : String(p)}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-700">
                    {title} × {item.quantity}
                  </span>
                  {price && (
                    <span className="font-medium">
                      {price.currency}{" "}
                      {(price.price * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
            {cart?.summary && (
              <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                <span>Total</span>
                <span>
                  {cart.summary.currency} {cart.summary.subtotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </section>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePlaceOrder}
          isLoading={placeOrderMutation.isPending}
          disabled={
            items.length === 0 || (!selectedAddress && addresses.length === 0)
          }
        >
          <CheckCircle className="w-5 h-5 mr-2" /> Place Order
        </Button>
      </div>

      <Modal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Add New Address"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={newAddress.recipient?.fullName ?? ""}
            onChange={(e) =>
              setNewAddress((prev) => ({
                ...prev,
                recipient: { ...prev.recipient!, fullName: e.target.value },
              }))
            }
            placeholder="Jane Doe"
          />
          <Input
            label="Address Line 1"
            value={newAddress.addressLine1 ?? ""}
            onChange={(e) =>
              setNewAddress((prev) => ({
                ...prev,
                addressLine1: e.target.value,
              }))
            }
            placeholder="123 Main St"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newAddress.city ?? ""}
              onChange={(e) =>
                setNewAddress((prev) => ({ ...prev, city: e.target.value }))
              }
              placeholder="New York"
            />
            <Input
              label="Postal Code"
              value={newAddress.postalCode ?? ""}
              onChange={(e) =>
                setNewAddress((prev) => ({
                  ...prev,
                  postalCode: e.target.value,
                }))
              }
              placeholder="10001"
            />
          </div>
          <Input
            label="Country"
            value={newAddress.country ?? "US"}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder="US"
          />
          <Button
            className="w-full"
            onClick={() =>
              addAddressMutation.mutate(newAddress as CreateAddressPayload)
            }
            isLoading={addAddressMutation.isPending}
          >
            Save Address
          </Button>
        </div>
      </Modal>
    </div>
  );
}
