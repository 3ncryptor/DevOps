"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Stepper } from "@/components/common/Stepper";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { sellersService } from "@/api/sellers";
import type { BusinessType } from "@/types/common";
import type { RegisterSellerPayload } from "@/types/seller";
import toast from "react-hot-toast";

const STEPS = [
  { id: "business", label: "Business Info" },
  { id: "contact", label: "Contact" },
  { id: "review", label: "Review" },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "COMPANY", label: "Company" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "OTHER", label: "Other" },
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterSellerPayload>({
    business: { legalName: "", displayName: "", businessType: "INDIVIDUAL" },
    contact: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: () => sellersService.registerAsSeller(form),
    onSuccess: async () => {
      toast.success("Seller application submitted! Pending admin approval.");
      // Refresh user session so the updated role is reflected in Zustand
      try {
        const meRes = await import("@/api/auth").then((m) =>
          m.authService.me(),
        );
        if (meRes.data) {
          const { useAuthStore } = await import("@/store/useAuthStore");
          const { accessToken, setAuth } = useAuthStore.getState();
          if (accessToken) setAuth(accessToken, meRes.data);
        }
      } catch {
        /* best-effort */
      }
      router.push("/seller");
    },
    onError: (error: unknown) => {
      const msg =
        (error as any)?.response?.data?.message ||
        "Failed to submit application";
      toast.error(msg);
    },
  });

  const set = (path: string, value: string) => {
    const [section, field] = path.split(".") as [
      "business" | "contact",
      string,
    ];
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete your seller profile to start listing products.
        </p>
      </div>

      <Stepper steps={STEPS} currentStep={step} />

      <div className="rounded-xl border border-gray-100 p-6 space-y-4">
        {step === 0 && (
          <>
            <h2 className="font-semibold text-gray-900">
              Business Information
            </h2>
            <Input
              label="Legal Business Name"
              value={form.business.legalName}
              onChange={(e) => set("business.legalName", e.target.value)}
              placeholder="Acme Corporation"
            />
            <Input
              label="Display Name (public)"
              value={form.business.displayName}
              onChange={(e) => set("business.displayName", e.target.value)}
              placeholder="Acme Store"
            />
            <Select
              label="Business Type"
              value={form.business.businessType}
              onChange={(e) =>
                set("business.businessType", e.target.value as BusinessType)
              }
              options={BUSINESS_TYPE_OPTIONS}
            />
            <Input
              label="Tax ID (optional)"
              value={form.business.taxIdentifier ?? ""}
              onChange={(e) => set("business.taxIdentifier", e.target.value)}
              placeholder="EIN / VAT number"
            />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
            <Input
              label="Business Email"
              type="email"
              value={form.contact.email}
              onChange={(e) => set("contact.email", e.target.value)}
              placeholder="business@example.com"
            />
            <Input
              label="Business Phone (optional)"
              type="tel"
              value={form.contact.phone ?? ""}
              onChange={(e) => set("contact.phone", e.target.value)}
              placeholder="+1 555 0100"
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold text-gray-900">
              Review Your Application
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="p-3 rounded-xl bg-gray-50 space-y-1.5">
                <p>
                  <span className="font-medium">Legal Name:</span>{" "}
                  {form.business.legalName}
                </p>
                <p>
                  <span className="font-medium">Display Name:</span>{" "}
                  {form.business.displayName}
                </p>
                <p>
                  <span className="font-medium">Business Type:</span>{" "}
                  {form.business.businessType}
                </p>
                {form.business.taxIdentifier && (
                  <p>
                    <span className="font-medium">Tax ID:</span>{" "}
                    {form.business.taxIdentifier}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-gray-50 space-y-1.5">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {form.contact.email}
                </p>
                {form.contact.phone && (
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {form.contact.phone}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 0 &&
                (!form.business.legalName || !form.business.displayName)) ||
              (step === 1 && !form.contact.email)
            }
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
          >
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}
