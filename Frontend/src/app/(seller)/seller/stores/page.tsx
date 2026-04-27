"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Store, Edit, XCircle, ExternalLink } from "lucide-react";
import { storesService } from "@/api/stores";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import type { CreateStorePayload, Store as StoreType } from "@/types/seller";
import toast from "react-hot-toast";

export default function SellerStoresPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editStore, setEditStore] = useState<StoreType | null>(null);
  const [form, setForm] = useState<CreateStorePayload>({
    name: "",
    description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["my-stores"],
    queryFn: storesService.getMyStores,
  });

  const createMutation = useMutation({
    mutationFn: () => storesService.createStore(form),
    onSuccess: () => {
      toast.success("Store created");
      queryClient.invalidateQueries({ queryKey: ["my-stores"] });
      setShowCreate(false);
      setForm({ name: "", description: "" });
    },
    onError: () => toast.error("Failed to create store"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateStorePayload> }) =>
      storesService.updateStore(payload.id, payload.data),
    onSuccess: () => {
      toast.success("Store updated");
      queryClient.invalidateQueries({ queryKey: ["my-stores"] });
      setEditStore(null);
    },
    onError: () => toast.error("Failed to update store"),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => storesService.closeStore(id),
    onSuccess: () => {
      toast.success("Store closed");
      queryClient.invalidateQueries({ queryKey: ["my-stores"] });
    },
    onError: () => toast.error("Failed to close store"),
  });

  const stores = data?.data ?? [];
  const storeStatusVariant = (s: string) =>
    s === "ACTIVE" ? "success" : s === "CLOSED" ? "default" : "error";

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Stores</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Store
        </Button>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={<Store className="w-14 h-14" />}
          title="No stores yet"
          description="Create your first store to start listing products."
          action={
            <Button onClick={() => setShowCreate(true)}>Create Store</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <div
              key={store._id}
              className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-white"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {store.storeIdentity.name}
                  </span>
                  <Badge
                    variant={
                      storeStatusVariant(store.storeStatus) as
                        | "success"
                        | "default"
                        | "error"
                    }
                  >
                    {store.storeStatus}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">
                  /{store.storeIdentity.slug}
                </p>
                {store.description && (
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {store.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 ml-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditStore(store)}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                {store.storeStatus === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => closeMutation.mutate(store._id)}
                    isLoading={closeMutation.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Store"
      >
        <div className="space-y-4">
          <Input
            label="Store Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="My Awesome Store"
          />
          <Textarea
            label="Description (optional)"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Tell customers about your store"
            rows={3}
          />
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!form.name}
          >
            Create Store
          </Button>
        </div>
      </Modal>

      {/* Edit modal */}
      {editStore && (
        <Modal
          open={!!editStore}
          onClose={() => setEditStore(null)}
          title="Edit Store"
        >
          <div className="space-y-4">
            <Input
              label="Store Name"
              defaultValue={editStore.storeIdentity.name}
              onChange={(e) =>
                setEditStore((s) =>
                  s
                    ? {
                        ...s,
                        storeIdentity: {
                          ...s.storeIdentity,
                          name: e.target.value,
                        },
                      }
                    : s,
                )
              }
            />
            <Textarea
              label="Description"
              defaultValue={editStore.description}
              onChange={(e) =>
                setEditStore((s) =>
                  s ? { ...s, description: e.target.value } : s,
                )
              }
              rows={3}
            />
            <Button
              className="w-full"
              onClick={() =>
                updateMutation.mutate({
                  id: editStore._id,
                  data: {
                    name: editStore.storeIdentity.name,
                    description: editStore.description,
                  },
                })
              }
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
