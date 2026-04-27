"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  MapPin,
  Star,
  User as UserIcon,
  Lock,
} from "lucide-react";
import { usersService } from "@/api/users";
import { authService } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import type { CreateAddressPayload } from "@/types/user";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAddress, setNewAddress] = useState<Partial<CreateAddressPayload>>({
    type: "SHIPPING",
    label: "HOME",
    recipient: { fullName: "" },
    addressLine1: "",
    country: "US",
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: usersService.getMe,
  });

  useEffect(() => {
    if (!profileData?.data) return;
    setFirstName(profileData.data.profile?.personal?.firstName ?? "");
    setLastName(profileData.data.profile?.personal?.lastName ?? "");
    setPhone(profileData.data.profile?.contact?.primaryPhone ?? "");
  }, [profileData]);

  const { data: addressesData } = useQuery({
    queryKey: ["addresses"],
    queryFn: usersService.getAddresses,
  });

  const updateProfileMutation = useMutation({
    mutationFn: () => usersService.updateMe({ firstName, lastName, phone }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authService.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password changed");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: () =>
      toast.error("Failed to change password. Check your current password."),
  });

  const addAddressMutation = useMutation({
    mutationFn: () =>
      usersService.addAddress(newAddress as CreateAddressPayload),
    onSuccess: () => {
      toast.success("Address added");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setShowAddressModal(false);
    },
    onError: () => toast.error("Failed to add address"),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteAddress(id),
    onSuccess: () => {
      toast.success("Address removed");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => usersService.setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  const addresses = addressesData?.data ?? [];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Personal info */}
      <section className="rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <UserIcon className="w-4 h-4" /> Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>
        <Input
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 0100"
          type="tel"
        />
        <div className="flex gap-2">
          <Button
            onClick={() => updateProfileMutation.mutate()}
            isLoading={updateProfileMutation.isPending}
          >
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
            <Lock className="w-4 h-4 mr-1.5" /> Change Password
          </Button>
        </div>
      </section>

      {/* Addresses */}
      <section className="rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Saved Addresses
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddressModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>

        {addresses.length === 0 ? (
          <p className="text-sm text-gray-400">No addresses saved yet.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="flex items-start justify-between p-3 rounded-xl border border-gray-100"
              >
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {addr.recipient.fullName}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="text-xs font-medium text-black flex items-center gap-0.5">
                        <Star className="w-3 h-3" fill="currentColor" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    {addr.addressLine1}
                    {addr.city && `, ${addr.city}`}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setDefaultMutation.mutate(addr._id)}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteAddressMutation.mutate(addr._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Address Modal */}
      <Modal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Add Address"
      >
        <div className="space-y-3">
          <Input
            label="Full Name"
            value={newAddress.recipient?.fullName ?? ""}
            onChange={(e) =>
              setNewAddress((p) => ({
                ...p,
                recipient: { ...p.recipient!, fullName: e.target.value },
              }))
            }
            placeholder="Jane Doe"
          />
          <Input
            label="Address Line 1"
            value={newAddress.addressLine1 ?? ""}
            onChange={(e) =>
              setNewAddress((p) => ({ ...p, addressLine1: e.target.value }))
            }
            placeholder="123 Main St"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newAddress.city ?? ""}
              onChange={(e) =>
                setNewAddress((p) => ({ ...p, city: e.target.value }))
              }
              placeholder="New York"
            />
            <Input
              label="Postal Code"
              value={newAddress.postalCode ?? ""}
              onChange={(e) =>
                setNewAddress((p) => ({ ...p, postalCode: e.target.value }))
              }
              placeholder="10001"
            />
          </div>
          <Input
            label="Country"
            value={newAddress.country ?? "US"}
            onChange={(e) =>
              setNewAddress((p) => ({ ...p, country: e.target.value }))
            }
            placeholder="US"
          />
          <Button
            className="w-full"
            onClick={() => addAddressMutation.mutate()}
            isLoading={addAddressMutation.isPending}
          >
            Save Address
          </Button>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-3">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button
            className="w-full"
            onClick={() => changePasswordMutation.mutate()}
            isLoading={changePasswordMutation.isPending}
          >
            Update Password
          </Button>
        </div>
      </Modal>
    </div>
  );
}
