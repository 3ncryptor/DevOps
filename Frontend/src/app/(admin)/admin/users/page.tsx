"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/api/admin";
import { AccountStatusBadge, Badge } from "@/components/common/Badge";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/common/Table";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { Select } from "@/components/common/Select";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "USER", label: "User" },
  { value: "SELLER", label: "Seller" },
  { value: "SUPER_ADMIN", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, role, status, search],
    queryFn: () =>
      adminService.getUsers({
        page,
        limit: 20,
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
      }),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => adminService.suspendUser(userId),
    onSuccess: () => {
      toast.success("User suspended");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed"),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => adminService.activateUser(userId),
    onSuccess: () => {
      toast.success("User activated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed"),
  });

  const users = data?.data?.users ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Users</h1>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[180px] px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
        />
        <Select
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="w-36"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-36"
        />
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Joined</Th>
            <Th>Actions</Th>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={5} />
              ))
            : users.map((user) => (
                <TableRow key={user._id}>
                  <Td className="text-sm font-medium">{user.email}</Td>
                  <Td>
                    <Badge variant="default">{user.role}</Badge>
                  </Td>
                  <Td>
                    <AccountStatusBadge status={user.accountStatus} />
                  </Td>
                  <Td className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Td>
                  <Td>
                    {user.accountStatus === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => suspendMutation.mutate(user._id)}
                        isLoading={suspendMutation.isPending}
                      >
                        Suspend
                      </Button>
                    ) : user.accountStatus === "SUSPENDED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => activateMutation.mutate(user._id)}
                        isLoading={activateMutation.isPending}
                      >
                        Activate
                      </Button>
                    ) : null}
                  </Td>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
