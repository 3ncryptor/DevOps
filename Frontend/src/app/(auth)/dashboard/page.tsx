"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    if (user.role === "SUPER_ADMIN") router.replace("/admin");
    else if (user.role === "SELLER") router.replace("/seller");
    else router.replace("/profile");
  }, [user, router]);

  return null;
}
