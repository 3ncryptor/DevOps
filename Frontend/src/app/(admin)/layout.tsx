"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Skeleton } from "@/components/common/Skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "SUPER_ADMIN") router.push("/");
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated)
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  if (!isAuthenticated || user?.role !== "SUPER_ADMIN") return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
