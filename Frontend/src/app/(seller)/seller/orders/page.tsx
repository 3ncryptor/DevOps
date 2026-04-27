"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "@/api/orders";
import { storesService } from "@/api/stores";
import { OrderStatusBadge } from "@/components/common/Badge";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/common/Table";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { ShoppingBag } from "lucide-react";
import type { Order } from "@/types/order";
import toast from "react-hot-toast";

export default function SellerOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shipData, setShipData] = useState({ trackingNumber: "", carrier: "" });
  const [showShipModal, setShowShipModal] = useState(false);

  const { data: storesData } = useQuery({
    queryKey: ["my-stores"],
    queryFn: storesService.getMyStores,
  });

  const storeId = storesData?.data?.[0]?._id;

  const { data, isLoading } = useQuery({
    queryKey: ["seller-orders", storeId, page, status],
    queryFn: () =>
      ordersService.getStoreOrders(storeId!, {
        page,
        limit: 15,
        status: status || undefined,
      }),
    enabled: !!storeId,
  });

  const processMutation = useMutation({
    mutationFn: (orderId: string) => ordersService.processOrder(orderId),
    onSuccess: () => {
      toast.success("Order processing");
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
    },
    onError: () => toast.error("Failed"),
  });

  const shipMutation = useMutation({
    mutationFn: (orderId: string) => ordersService.shipOrder(orderId, shipData),
    onSuccess: () => {
      toast.success("Order shipped");
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      setShowShipModal(false);
    },
    onError: () => toast.error("Failed"),
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => ordersService.deliverOrder(orderId),
    onSuccess: () => {
      toast.success("Order delivered");
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
    },
    onError: () => toast.error("Failed"),
  });

  const orders = data?.data?.orders ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  const STATUS_FILTERS = [
    "",
    "CREATED",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Store Orders</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${status === s ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {!storeId ? (
        <EmptyState
          title="No store found"
          description="Create a store first."
        />
      ) : orders.length === 0 && !isLoading ? (
        <EmptyState
          icon={<ShoppingBag className="w-14 h-14" />}
          title="No orders yet"
          description="Orders from your store will appear here."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <Th>Order #</Th>
              <Th>Date</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} />
                ))
              : orders.map((order) => (
                  <TableRow key={order._id}>
                    <Td className="font-mono text-xs font-semibold">
                      #{order.orderNumber}
                    </Td>
                    <Td className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Td>
                    <Td className="text-sm font-medium">
                      {order.pricing.totalAmount.toFixed(2)}
                    </Td>
                    <Td>
                      <OrderStatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        {order.status === "PAID" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => processMutation.mutate(order._id)}
                            isLoading={processMutation.isPending}
                          >
                            Process
                          </Button>
                        )}
                        {order.status === "PROCESSING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowShipModal(true);
                            }}
                          >
                            Ship
                          </Button>
                        )}
                        {order.status === "SHIPPED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => deliverMutation.mutate(order._id)}
                            isLoading={deliverMutation.isPending}
                          >
                            Deliver
                          </Button>
                        )}
                      </div>
                    </Td>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={showShipModal}
        onClose={() => setShowShipModal(false)}
        title="Ship Order"
      >
        <div className="space-y-3">
          <Input
            label="Tracking Number"
            value={shipData.trackingNumber}
            onChange={(e) =>
              setShipData((p) => ({ ...p, trackingNumber: e.target.value }))
            }
            placeholder="1Z999AA10123456784"
          />
          <Input
            label="Carrier"
            value={shipData.carrier}
            onChange={(e) =>
              setShipData((p) => ({ ...p, carrier: e.target.value }))
            }
            placeholder="UPS, FedEx, USPS…"
          />
          <Button
            className="w-full"
            onClick={() =>
              selectedOrder && shipMutation.mutate(selectedOrder._id)
            }
            isLoading={shipMutation.isPending}
            disabled={!shipData.trackingNumber || !shipData.carrier}
          >
            Confirm Shipment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
