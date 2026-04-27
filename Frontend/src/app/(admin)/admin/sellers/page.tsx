"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/api/admin";
import { SellerStatusBadge } from "@/components/common/Badge";
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
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import toast from "react-hot-toast";

export default function AdminSellersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"all" | "pending">("pending");
  const [rejectModal, setRejectModal] = useState<{ sellerId: string } | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ["admin-sellers", page],
    queryFn: () => adminService.getSellers({ page, limit: 20 }),
    enabled: view === "all",
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-sellers-pending"],
    queryFn: adminService.getPendingSellers,
    enabled: view === "pending",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveSeller(id),
    onSuccess: () => {
      toast.success("Seller approved");
      queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sellers-pending"] });
    },
    onError: () => toast.error("Failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectSeller(id, reason),
    onSuccess: () => {
      toast.success("Seller rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sellers-pending"] });
      setRejectModal(null);
      setRejectReason("");
    },
    onError: () => toast.error("Failed"),
  });

  const sellers =
    view === "pending"
      ? (pendingData?.data?.sellers ?? [])
      : (allData?.data?.sellers ?? []);

  const totalPages =
    view === "all" ? (allData?.data?.pagination?.pages ?? 1) : 1;
  const isLoading = view === "pending" ? pendingLoading : allLoading;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Sellers</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setView("pending")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${view === "pending" ? "bg-black text-white border-black" : "border-gray-200 text-gray-600"}`}
        >
          Pending Approval
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${view === "all" ? "bg-black text-white border-black" : "border-gray-200 text-gray-600"}`}
        >
          All Sellers
        </button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <Th>Display Name</Th>
            <Th>Legal Name</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={5} />
              ))
            : sellers.map((seller) => (
                <TableRow key={seller._id}>
                  <Td className="text-sm font-medium">
                    {seller.business.displayName}
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {seller.business.legalName}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {seller.business.businessType}
                  </Td>
                  <Td>
                    <SellerStatusBadge status={seller.status} />
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      {seller.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => approveMutation.mutate(seller._id)}
                            isLoading={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() =>
                              setRejectModal({ sellerId: seller._id })
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {view === "all" && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject Seller"
      >
        <div className="space-y-3">
          <Input
            label="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide a reason…"
          />
          <Button
            className="w-full"
            onClick={() =>
              rejectModal &&
              rejectMutation.mutate({
                id: rejectModal.sellerId,
                reason: rejectReason,
              })
            }
            isLoading={rejectMutation.isPending}
            disabled={!rejectReason}
          >
            Confirm Rejection
          </Button>
        </div>
      </Modal>
    </div>
  );
}
