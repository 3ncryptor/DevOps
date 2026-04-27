"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, History, DollarSign } from "lucide-react";
import { productsService } from "@/api/products";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { ProductStatusBadge } from "@/components/common/Badge";
import { Skeleton } from "@/components/common/Skeleton";
import toast from "react-hot-toast";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [stock, setStock] = useState(0);
  const [reorderThreshold, setReorderThreshold] = useState(0);
  const [newPrice, setNewPrice] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-product", id],
    queryFn: () => productsService.getMyProductById(id),
    enabled: !!id,
  });

  const { data: priceHistoryData } = useQuery({
    queryKey: ["price-history", id],
    queryFn: () => productsService.getPriceHistory(id),
    enabled: !!id,
  });

  const product = data?.data;

  useEffect(() => {
    if (!product) return;
    setTitle(product.identity.title);
    setDescription(product.identity.description ?? "");
    setBrand(product.attributes?.brand ?? "");
    setStock(product.inventory?.availableStock ?? 0);
    setReorderThreshold(product.inventory?.reorderThreshold ?? 0);
    setNewPrice(String(product.currentPrice?.price ?? ""));
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: () =>
      productsService.updateProduct(id, {
        identity: { title, description: description || undefined },
        attributes: { brand: brand || undefined },
      }),
    onSuccess: () => {
      toast.success("Product updated");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to update"),
  });

  const priceMutation = useMutation({
    mutationFn: () =>
      productsService.updateProduct(id, { price: parseFloat(newPrice) }),
    onSuccess: () => {
      toast.success("Price updated");
      queryClient.invalidateQueries({ queryKey: ["my-product", id] });
      queryClient.invalidateQueries({ queryKey: ["price-history", id] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as any)?.response?.data?.message || "Failed to update price",
      ),
  });

  const inventoryMutation = useMutation({
    mutationFn: () =>
      productsService.updateInventory(id, {
        availableStock: stock,
        reorderThreshold,
      }),
    onSuccess: () => toast.success("Inventory updated"),
    onError: (e: unknown) =>
      toast.error(
        (e as any)?.response?.data?.message || "Failed to update inventory",
      ),
  });

  const addImageMutation = useMutation({
    mutationFn: () =>
      productsService.addImages(id, [{ url: newImageUrl, altText: title }]),
    onSuccess: () => {
      toast.success("Image added");
      queryClient.invalidateQueries({ queryKey: ["my-product", id] });
      setNewImageUrl("");
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to add image"),
  });

  const removeImageMutation = useMutation({
    mutationFn: (imageId: string) => productsService.removeImage(id, imageId),
    onSuccess: () => {
      toast.success("Image removed");
      queryClient.invalidateQueries({ queryKey: ["my-product", id] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as any)?.response?.data?.message || "Failed to remove image",
      ),
  });

  const publishMutation = useMutation({
    mutationFn: () => productsService.publishProduct(id),
    onSuccess: () => {
      toast.success("Product published");
      queryClient.invalidateQueries({ queryKey: ["my-product", id] });
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to publish"),
  });

  const archiveMutation = useMutation({
    mutationFn: () => productsService.archiveProduct(id),
    onSuccess: () => {
      toast.success("Product archived");
      queryClient.invalidateQueries({ queryKey: ["my-product", id] });
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to archive"),
  });

  if (isLoading || !product) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const priceHistory = priceHistoryData?.data ?? [];
  const currentPrice = product.currentPrice;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/seller/products")}
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {product.identity.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ProductStatusBadge status={product.status} />
          {product.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              isLoading={publishMutation.isPending}
            >
              Publish
            </Button>
          )}
          {product.status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => archiveMutation.mutate()}
              isLoading={archiveMutation.isPending}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Identity
        </h2>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <Input
          label="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <Button
          onClick={() => updateMutation.mutate()}
          isLoading={updateMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {/* Price */}
      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Price
          </h2>
          {currentPrice && (
            <span className="text-sm text-gray-500">
              Current:{" "}
              <span className="font-semibold text-gray-900">
                {currentPrice.currency} {currentPrice.price.toFixed(2)}
              </span>
            </span>
          )}
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="New Price (USD)"
              type="number"
              min={0.01}
              step={0.01}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g. 49.99"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => priceMutation.mutate()}
            disabled={!newPrice || parseFloat(newPrice) <= 0}
            isLoading={priceMutation.isPending}
          >
            Update Price
          </Button>
        </div>
        {priceHistory.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Price history (
              {priceHistory.length})
            </summary>
            <div className="mt-2 space-y-1 pl-5 border-l border-gray-100">
              {[...priceHistory].reverse().map((ph, i) => (
                <div key={ph._id} className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {ph.currency} {ph.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(ph.effectiveFrom).toLocaleDateString()}
                    {i === 0 && (
                      <span className="ml-1 text-green-600 font-medium">
                        (current)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Inventory */}
      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Inventory
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Available Stock"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
          <Input
            label="Reorder Threshold"
            type="number"
            min={0}
            value={reorderThreshold}
            onChange={(e) => setReorderThreshold(Number(e.target.value))}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => inventoryMutation.mutate()}
          isLoading={inventoryMutation.isPending}
        >
          Update Inventory
        </Button>
      </div>

      {/* Images */}
      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Images
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {product.images?.map((img) => (
            <div
              key={img._id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText ?? title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImageMutation.mutate(img._id)}
                className="absolute top-1.5 right-1.5 p-1 bg-white rounded-full shadow text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Image URL"
            className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => addImageMutation.mutate()}
            disabled={!newImageUrl}
            isLoading={addImageMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
