"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/api/admin";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/common/Table";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/common/Badge";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, action],
    queryFn: () =>
      adminService.getAuditLogs({
        page,
        limit: 25,
        action: action || undefined,
      }),
  });

  const logs = data?.data?.logs ?? [];
  const totalPages = data?.data?.pagination?.pages ?? 1;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>

      <input
        type="text"
        placeholder="Filter by action…"
        value={action}
        onChange={(e) => {
          setAction(e.target.value);
          setPage(1);
        }}
        className="px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-black"
      />

      <Table>
        <TableHead>
          <TableRow>
            <Th>Action</Th>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Target</Th>
            <Th>Time</Th>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={5} />
              ))
            : logs.map((log) => (
                <TableRow key={log._id}>
                  <Td>
                    <span className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded text-gray-700">
                      {log.action}
                    </span>
                  </Td>
                  <Td className="text-xs font-mono text-gray-500">
                    {typeof log.userId === "object"
                      ? (log.userId.email ?? log.userId._id)
                      : log.userId}
                  </Td>
                  <Td>
                    <Badge variant="default" className="text-[10px]">
                      {typeof log.userId === "object"
                        ? log.userId.role
                        : log.userRole}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {log.targetType}
                    {log.targetId && ` / ${log.targetId.slice(0, 8)}…`}
                  </Td>
                  <Td className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </Td>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
