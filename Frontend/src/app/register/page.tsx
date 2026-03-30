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

// User role enum
export enum UserRole {
  USER = 'USER',
  SELLER = 'SELLER',
}

// Define strict validation matching backend requirement
const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs at least one uppercase letter')
    .regex(/[a-z]/, 'Password needs at least one lowercase letter')
    .regex(/[0-9]/, 'Password needs at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['USER', 'SELLER'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.USER,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // 1. Hit the backend register endpoint
      await authService.register({
        email: data.email,
        password: data.password,
        role: data.role,
      });

      toast.success('Account created successfully! Please login.');
      
      // 2. Redirect to login
      router.push('/login');
    } catch (error: unknown) {
      // Safely extract backend errors if array of validation errors existed
      const errorMessage = (error as any).response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create an account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Join the Zentra marketplace today.
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

          {/* Role Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Account Type <span className="text-red-500">*</span>
            </label>
            <fieldset className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="user-role"
                  value={UserRole.USER}
                  {...register('role')}
                  className="h-4 w-4 border-gray-300 text-black focus:ring-2 focus:ring-black"
                />
                <label htmlFor="user-role" className="ml-3 block cursor-pointer">
                  <span className="font-medium text-gray-900">Buyer</span>
                  <p className="text-sm text-gray-500">Browse and purchase products</p>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="seller-role"
                  value={UserRole.SELLER}
                  {...register('role')}
                  className="h-4 w-4 border-gray-300 text-black focus:ring-2 focus:ring-black"
                />
                <label htmlFor="seller-role" className="ml-3 block cursor-pointer">
                  <span className="font-medium text-gray-900">Seller</span>
                  <p className="text-sm text-gray-500">Create a store and sell products</p>
                </label>
              </div>
            </fieldset>
            {errors.role && (
              <p className="mt-2 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
          
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
