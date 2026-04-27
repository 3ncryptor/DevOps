"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { adminService } from "@/api/admin";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import type { Category } from "@/types/product";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: adminService.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: () => adminService.createCategory({ name }),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowCreate(false);
      setName("");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminService.updateCategory(editCat!._id, { name: editCat!.name }),
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditCat(null);
    },
    onError: () => toast.error("Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Failed"),
  });

  const categories = data?.data?.flat ?? [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <Button
          onClick={() => {
            setName("");
            setShowCreate(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-14 h-14" />}
          title="No categories yet"
          action={
            <Button onClick={() => setShowCreate(true)}>
              Create First Category
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400">/{cat.slug}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditCat(cat)}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Delete this category?"))
                      deleteMutation.mutate(cat._id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Category"
      >
        <div className="space-y-3">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Electronics"
          />
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!name}
          >
            Create
          </Button>
        </div>
      </Modal>

      {editCat && (
        <Modal
          open={!!editCat}
          onClose={() => setEditCat(null)}
          title="Edit Category"
        >
          <div className="space-y-3">
            <Input
              label="Category Name"
              value={editCat.name}
              onChange={(e) =>
                setEditCat((c) => (c ? { ...c, name: e.target.value } : c))
              }
            />
            <Button
              className="w-full"
              onClick={() => updateMutation.mutate()}
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
