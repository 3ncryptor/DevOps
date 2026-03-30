'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';

import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const resp = await authService.login({
        email: data.email,
        password: data.password,
      });

      // Validated 200 response -> update global auth store
      setAuth(resp.data.accessToken, resp.data.user);
      toast.success('Welcome back!');
      
      // Navigate to dashboard 
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.message || 'Invalid credentials';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sign In</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back to Zentra.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            autoComplete="email"
          />
          
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-black hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
