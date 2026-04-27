"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { ShoppingBag, Store, ShieldCheck } from "lucide-react";

import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { authService } from "@/api/auth";

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password needs at least one uppercase letter")
      .regex(/[a-z]/, "Password needs at least one lowercase letter")
      .regex(/[0-9]/, "Password needs at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["USER", "SELLER", "SUPER_ADMIN"], {
      errorMap: () => ({ message: "Please select a role" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const ROLES = [
  {
    value: "USER" as const,
    icon: ShoppingBag,
    label: "Buyer",
    description: "Browse and purchase products",
  },
  {
    value: "SELLER" as const,
    icon: Store,
    label: "Seller",
    description: "Create a store and sell products",
  },
  {
    value: "SUPER_ADMIN" as const,
    icon: ShieldCheck,
    label: "Admin",
    description: "Full platform management access",
    badge: "Testing",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "USER" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        role: data.role,
      });
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (error: unknown) {
      const errorMessage =
        (error as any).response?.data?.message || "Registration failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Create an account
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Join the Zentra marketplace today.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            autoComplete="email"
          />

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {ROLES.map(({ value, icon: Icon, label, description, badge }) => {
                const isSelected = selectedRole === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setValue("role", value, { shouldValidate: true })
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-gray-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-900"}`}
                        >
                          {label}
                        </span>
                        {badge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${isSelected ? "text-white/75" : "text-gray-400"}`}
                      >
                        {description}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-white" : "border-gray-300"}`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* hidden input to register the role value */}
            <input type="hidden" {...register("role")} />
            {errors.role && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.role.message}
              </p>
            )}
          </div>

          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            {...register("password")}
            error={errors.password?.message}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-black hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
