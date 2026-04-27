"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Archive,
} from "lucide-react";
import { productsService } from "@/api/products";
import { storesService } from "@/api/stores";
import { Button } from "@/components/common/Button";
import { ProductStatusBadge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/common/Table";
import { TableRowSkeleton, Skeleton } from "@/components/common/Skeleton";
import { Select } from "@/components/common/Select";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function SellerProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");

  // Fetch seller's stores first
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["my-stores"],
    queryFn: storesService.getMyStores,
  });

  const stores = storesData?.data ?? [];
  const storeId = selectedStoreId || stores[0]?._id;

  const { data, isLoading } = useQuery({
    queryKey: ["my-products", storeId, page, status, search],
    queryFn: () =>
      productsService.getMyProducts({
        storeId,
        page,
        limit: 15,
        status: status || undefined,
        search: search || undefined,
      }),
    enabled: !!storeId,
  });

  const publishMutation = useMutation({
    mutationFn: productsService.publishProduct,
    onSuccess: () => {
      toast.success("Product published");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to publish"),
  });

  const archiveMutation = useMutation({
    mutationFn: productsService.archiveProduct,
    onSuccess: () => {
      toast.success("Product archived");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to archive"),
  });

  const deleteMutation = useMutation({
    mutationFn: productsService.deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e: unknown) =>
      toast.error((e as any)?.response?.data?.message || "Failed to delete"),
  });

  const products = data?.data?.products ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  if (storesLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <EmptyState
          icon={<Package className="w-14 h-14" />}
          title="No store yet"
          description="Create a store before adding products."
          action={
            <Link href="/seller/stores">
              <Button>Go to Stores</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const storeOptions = stores.map((s) => ({
    value: s._id,
    label: s.storeIdentity.name,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">My Products</h1>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-1.5" /> New Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        {stores.length > 1 && (
          <Select
            options={storeOptions}
            value={storeId ?? ""}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              setPage(1);
            }}
            className="w-48"
          />
        )}
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[180px] px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
      </div>

      {products.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Package className="w-14 h-14" />}
          title="No products yet"
          description="Create your first product to start selling."
          action={
            <Link href="/seller/products/new">
              <Button>Create Product</Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <Th>Product</Th>
              <Th>Status</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} />
                ))
              : products.map((product) => {
                  const price = product.currentPrice;
                  const stock = product.inventory?.availableStock;
                  return (
                    <TableRow key={product._id}>
                      <Td>
                        <div className="max-w-[200px]">
                          <p className="font-medium text-gray-900 truncate text-sm">
                            {product.identity.title}
                          </p>
                          {product.attributes?.brand && (
                            <p className="text-xs text-gray-400">
                              {product.attributes.brand}
                            </p>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <ProductStatusBadge status={product.status} />
                      </Td>
                      <Td className="text-sm font-medium">
                        {price
                          ? `${price.currency} ${price.price.toFixed(2)}`
                          : "—"}
                      </Td>
                      <Td className="text-sm">{stock ?? "—"}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <Link href={`/seller/products/${product._id}/edit`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {product.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() =>
                                publishMutation.mutate(product._id)
                              }
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {product.status === "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              onClick={() =>
                                archiveMutation.mutate(product._id)
                              }
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {product.status === "ARCHIVED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:bg-green-50"
                              onClick={() =>
                                publishMutation.mutate(product._id)
                              }
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Delete this product?"))
                                deleteMutation.mutate(product._id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
