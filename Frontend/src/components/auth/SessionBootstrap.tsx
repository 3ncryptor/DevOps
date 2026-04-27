"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/api/auth";

export function SessionBootstrap() {
  const { accessToken, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    authService
      .me()
      .then((res) => {
        if (res.data) setAuth(accessToken, res.data);
      })
      .catch(() => {
        logout();
      });
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
