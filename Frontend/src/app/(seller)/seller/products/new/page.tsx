"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { productsService } from "@/api/products";
import { storesService } from "@/api/stores";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Select } from "@/components/common/Select";
import { FileUpload } from "@/components/common/FileUpload";
import type { CreateProductPayload, Category } from "@/types/product";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<CreateProductPayload>>({
    identity: { title: "" },
    price: 0,
    initialStock: 0,
  });
  const [imageUrl, setImageUrl] = useState("");

  const { data: storesData } = useQuery({
    queryKey: ["my-stores"],
    queryFn: storesService.getMyStores,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: productsService.getCategories,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await productsService.createProduct(
        form as CreateProductPayload,
      );
      if (imageUrl && res.data?._id) {
        await productsService.addImages(res.data._id, [
          { url: imageUrl, altText: form.identity?.title },
        ]);
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Product created");
      router.push("/seller/products");
    },
    onError: (error: unknown) => {
      const msg =
        (error as any)?.response?.data?.message || "Failed to create product";
      toast.error(msg);
    },
  });

  const stores = storesData?.data ?? [];
  const categories = (categoriesData?.data?.flat ?? []) as Category[];

  const storeOptions = stores.map((s) => ({
    value: s._id,
    label: s.storeIdentity.name,
  }));
  const categoryOptions = categories.map((c: Category) => ({
    value: c._id,
    label: c.name,
  }));

  // Auto-select the first store if only one exists and form has no storeId yet
  if (stores.length === 1 && !form.storeId) {
    setForm((p) => ({ ...p, storeId: stores[0]._id }));
  }

  const isValid = !!(
    form.storeId &&
    form.categoryId &&
    form.identity?.title &&
    form.identity?.description &&
    form.price &&
    form.price > 0
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Product</h1>
      </div>

      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Store & Category
        </h2>
        <Select
          label="Store"
          options={storeOptions}
          placeholder="Select a store"
          value={form.storeId ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
        />
        {categoryOptions.length > 0 ? (
          <Select
            label="Category *"
            options={categoryOptions}
            placeholder="Select a category"
            value={form.categoryId ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, categoryId: e.target.value }))
            }
          />
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No categories yet. Ask an admin to create categories before adding
            products.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Identity
        </h2>
        <Input
          label="Product Title"
          value={form.identity?.title ?? ""}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              identity: { ...p.identity!, title: e.target.value },
            }))
          }
          placeholder="My Amazing Product"
        />
        <Input
          label="Subtitle (optional)"
          value={form.identity?.subtitle ?? ""}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              identity: { ...p.identity!, subtitle: e.target.value },
            }))
          }
          placeholder="Short tagline"
        />
        <Textarea
          label="Description *"
          value={form.identity?.description ?? ""}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              identity: { ...p.identity!, description: e.target.value },
            }))
          }
          placeholder="Describe your product…"
          rows={4}
        />
      </div>

      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Attributes
        </h2>
        <Input
          label="Brand (optional)"
          value={form.attributes?.brand ?? ""}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              attributes: { ...p.attributes, brand: e.target.value },
            }))
          }
          placeholder="Nike"
        />
        <Input
          label="SKU (optional)"
          value={form.attributes?.sku ?? ""}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              attributes: { ...p.attributes, sku: e.target.value },
            }))
          }
          placeholder="PROD-001"
        />
      </div>

      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Pricing & Stock
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price"
            type="number"
            min={0}
            step={0.01}
            value={form.price ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
            }
            placeholder="29.99"
          />
          <Input
            label="Initial Stock"
            type="number"
            min={0}
            value={form.initialStock ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                initialStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="100"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Product Image
        </h2>
        <FileUpload
          value={imageUrl}
          onChange={setImageUrl}
          onRemove={() => setImageUrl("")}
          placeholder="Paste image URL (Cloudinary, etc.)"
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => mutation.mutate()}
        isLoading={mutation.isPending}
        disabled={!isValid}
      >
        Create Product
      </Button>
    </div>
  );
}
