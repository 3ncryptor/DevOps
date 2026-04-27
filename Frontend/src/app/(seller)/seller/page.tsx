"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Store,
  Package,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { storesService } from "@/api/stores";
import { ordersService } from "@/api/orders";
import { DataCard } from "@/components/common/DataCard";
import { DataCardSkeleton } from "@/components/common/Skeleton";
import { SellerStatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { sellersService } from "@/api/sellers";
import { useAuthStore } from "@/store/useAuthStore";

export default function SellerDashboardPage() {
  const { user } = useAuthStore();

  const { data: sellerData } = useQuery({
    queryKey: ["seller-profile"],
    queryFn: sellersService.getMyProfile,
    retry: false,
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["my-stores"],
    queryFn: storesService.getMyStores,
  });

  const stores = storesData?.data ?? [];
  const seller = sellerData?.data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
      </div>

      {seller && seller.status !== "APPROVED" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-yellow-900">
              Account not yet approved
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-yellow-700">Current status:</p>
              <SellerStatusBadge status={seller.status} />
            </div>
            {seller.status === "PENDING" && (
              <p className="text-xs text-yellow-600">
                Your seller application is under review.
              </p>
            )}
          </div>
        </div>
      )}

      {!seller && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-900">
              Complete your seller profile
            </p>
            <p className="text-sm text-blue-700">
              Register as a seller to start creating stores and products.
            </p>
            <Link href="/seller/onboarding">
              <Button size="sm">
                Start Onboarding <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {storesLoading ? (
          <>
            <DataCardSkeleton />
            <DataCardSkeleton />
            <DataCardSkeleton />
          </>
        ) : (
          <>
            <DataCard
              title="Stores"
              value={stores.length}
              icon={<Store className="w-5 h-5" />}
              subtitle="Active stores"
            />
            <DataCard
              title="Products"
              value="—"
              icon={<Package className="w-5 h-5" />}
              subtitle="Go to Products"
            />
            <DataCard
              title="Orders"
              value="—"
              icon={<ShoppingBag className="w-5 h-5" />}
              subtitle="Pending orders"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/seller/stores"
          className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-black transition-colors"
        >
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            <div>
              <p className="text-sm font-semibold text-gray-900">My Stores</p>
              <p className="text-xs text-gray-400">Manage your store fronts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
        </Link>
        <Link
          href="/seller/products"
          className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-black transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            <div>
              <p className="text-sm font-semibold text-gray-900">My Products</p>
              <p className="text-xs text-gray-400">
                Create and manage products
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
        </Link>
      </div>
    </div>
  );
}
