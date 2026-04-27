"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  Tag,
} from "lucide-react";
import { adminService } from "@/api/admin";
import { DataCard } from "@/components/common/DataCard";
import { DataCardSkeleton } from "@/components/common/Skeleton";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminService.getStats(),
  });

  const stats = data?.data?.overview;

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? "—",
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "Sellers",
      value: stats?.totalSellers ?? "—",
      icon: <Store className="w-5 h-5" />,
    },
    {
      title: "Stores",
      value: stats?.totalStores ?? "—",
      icon: <Store className="w-5 h-5" />,
    },
    {
      title: "Products",
      value: stats?.totalProducts ?? "—",
      icon: <Package className="w-5 h-5" />,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? "—",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      title: "Revenue",
      value:
        stats?.totalRevenue != null ? `$${stats.totalRevenue.toFixed(2)}` : "—",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <DataCardSkeleton key={i} />
            ))
          : cards.map((card) => (
              <DataCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
              />
            ))}
      </div>
    </div>
  );
}
