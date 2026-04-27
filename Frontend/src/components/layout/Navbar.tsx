"use client";

import Link from "next/link";
import { ShoppingCart, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { Button, buttonVariants } from "@/components/common/Button";
import { authService } from "@/api/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cartService } from "@/api/cart";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, setCount } = useCartStore();
  const router = useRouter();

  // Sync cart count badge when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    cartService
      .getCount()
      .then((res) => setCount(res.data?.count ?? 0))
      .catch(() => {});
  }, [isAuthenticated, setCount]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore — clear local state regardless
    }
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight text-black"
          >
            Zentra
          </Link>

          <div className="flex items-center gap-x-4">
            <Link
              href="/cart"
              className="p-2 text-gray-500 hover:text-black transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {isAuthenticated && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-[10px] font-bold leading-none">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-x-4">
                {user?.role === "SELLER" && (
                  <Link
                    href="/seller"
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block"
                  >
                    Seller Hub
                  </Link>
                )}
                {user?.role === "SUPER_ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-x-2 border-l border-gray-200 pl-4"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline truncate max-w-[120px]">
                    {user?.email}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-black hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-x-2 border-l border-gray-200 pl-4">
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
