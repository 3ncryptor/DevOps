"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { productsService } from "@/api/products";
import { ProductCard } from "@/components/common/ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { cartService } from "@/api/cart";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
];

function HomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  const page = Number(params.get("page") ?? "1");
  const q = params.get("q") ?? "";
  const categoryId = params.get("category") ?? "";
  const sort = params.get("sort") ?? "";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  const setParam = (key: string, val: string) => {
    const sp = new URLSearchParams(params.toString());
    if (val) sp.set(key, val);
    else sp.delete(key);
    if (key !== "page") sp.delete("page");
    router.push(`/?${sp.toString()}`);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", page, q, categoryId, sort, minPrice, maxPrice],
    queryFn: () =>
      productsService.getProducts({
        page,
        limit: 12,
        search: q || undefined,
        categoryId: categoryId || undefined,
        sort: sort || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: productsService.getCategories,
    retry: false,
  });

  const products = data?.data?.products ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  const categories = categoriesData?.data?.flat ?? [];

  const handleAddToCart = async (productId: string) => {
    try {
      await cartService.addItem(productId, 1);
      increment();
      toast.success("Added to cart");
    } catch {
      toast.error("Could not add to cart");
    }
  };

  const hasFilters = q || categoryId || sort || minPrice || maxPrice;

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-screen">
      {/* Sidebar filters */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 p-6 space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Search
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Category
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => setParam("category", "")}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${!categoryId ? "bg-black text-white font-medium" : "text-gray-700 hover:bg-gray-100"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setParam("category", cat._id)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${categoryId === cat._id ? "bg-black text-white font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Price Range
          </h2>
          <div className="flex gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setParam("minPrice", e.target.value)}
              placeholder="Min"
              min={0}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setParam("maxPrice", e.target.value)}
              placeholder="Max"
              min={0}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Sort
          </h2>
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setParam("sort", opt.value)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${sort === opt.value ? "bg-black text-white font-medium" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Discover Zentra
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {data?.data?.pagination?.total != null
                ? `${data.data.pagination.total} product${data.data.pagination.total !== 1 ? "s" : ""} found`
                : "Explore our marketplace"}
            </p>
          </div>
          <SlidersHorizontal className="w-5 h-5 text-gray-400 lg:hidden" />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            title="Could not load products"
            description="Please make sure the backend server is running."
          />
        )}

        {!isLoading && !isError && products.length === 0 && (
          <EmptyState
            title="No products found"
            description="Try adjusting your search or filters."
          />
        )}

        {!isLoading && !isError && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setParam("page", String(p))}
              className="pt-4"
            />
          </>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
