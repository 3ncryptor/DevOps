'use client';

import Link from 'next/link';
import { ShoppingCart, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, buttonVariants } from '@/components/common/Button';
import { useRouter } from 'next/navigation';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-xl tracking-tight text-black">
              Zentra
            </Link>
          </div>

          <div className="flex items-center gap-x-4">
            <Link href="/cart" className="p-2 text-gray-500 hover:text-black transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-x-4">
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-x-2 border-l border-gray-300 pl-4">
                  <User className="w-4 h-4" />
                  {user?.email}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-black hover:bg-gray-100">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-x-2 border-l border-gray-300 pl-4">
                <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Log in
                </Link>
                <Link href="/register" className={buttonVariants({ variant: 'default', size: 'sm' })}>
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
