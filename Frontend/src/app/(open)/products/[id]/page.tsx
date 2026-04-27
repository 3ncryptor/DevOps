"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Store, Tag, Package, ChevronLeft } from "lucide-react";
import { productsService } from "@/api/products";
import { cartService } from "@/api/cart";
import { ImageGallery } from "@/components/common/ImageGallery";
import { Button } from "@/components/common/Button";
import { ProductStatusBadge } from "@/components/common/Badge";
import { Skeleton } from "@/components/common/Skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.getProductById(id),
    enabled: !!id,
  });

  const addToCart = useMutation({
    mutationFn: (qty: number) => cartService.addItem(id, qty),
    onSuccess: () => {
      increment();
      toast.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => toast.error("Could not add to cart"),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    addToCart.mutate(1);
  };

  const product = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-500">Product not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Go back
        </Button>
      </div>
    );
  }

  const activePrice = product.pricing?.[product.pricing.length - 1];
  const storeName =
    typeof product.storeId === "object"
      ? product.storeId.storeIdentity.name
      : null;
  const storeId =
    typeof product.storeId === "object" ? product.storeId._id : product.storeId;
  const categoryName =
    typeof product.categoryId === "object" ? product.categoryId.name : null;
  const stockAvailable = product.inventory?.availableStock ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <ImageGallery
          images={product.images ?? []}
          title={product.identity.title}
        />

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <ProductStatusBadge status={product.status} />
            {categoryName && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Tag className="w-3 h-3" /> {categoryName}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
              {product.identity.title}
            </h1>
            {product.identity.subtitle && (
              <p className="mt-1 text-base text-gray-500">
                {product.identity.subtitle}
              </p>
            )}
          </div>

          {activePrice && (
            <p className="text-3xl font-bold text-gray-900">
              {activePrice.currency} {activePrice.price.toFixed(2)}
            </p>
          )}

          {product.attributes?.brand && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Brand:</span>{" "}
              {product.attributes.brand}
            </p>
          )}

          {product.identity.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.identity.description}
            </p>
          )}

          {/* Stock */}
          {stockAvailable !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-gray-400" />
              {stockAvailable > 10 ? (
                <span className="text-green-600 font-medium">In Stock</span>
              ) : stockAvailable > 0 ? (
                <span className="text-yellow-600 font-medium">
                  Only {stockAvailable} left
                </span>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </div>
          )}

          {storeName && (
            <Link
              href={`/stores/${storeId}`}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 hover:bg-gray-100"
            >
              <Store className="w-4 h-4" />
              <span>
                Sold by{" "}
                <span className="font-semibold text-gray-800">{storeName}</span>
              </span>
            </Link>
          )}

          <Button
            size="lg"
            className="w-full mt-2"
            onClick={handleAddToCart}
            isLoading={addToCart.isPending}
            disabled={stockAvailable === 0}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {stockAvailable === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
