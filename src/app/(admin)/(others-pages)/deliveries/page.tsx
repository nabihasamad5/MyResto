"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

type Delivery = {
  id: number;
  order_id: number;
  delivery_boy_id: number | null;
  status: string;
  assigned_at: string | null;
  delivered_at: string | null;
};

export default function DeliveriesPage() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [usersOptions, setUsersOptions] = useState<{ value: string; label: string }[]>([]);
  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL as string;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const qp = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
        const res = await fetch(`${baseUrl}/api/deliveries${qp}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to fetch");
        setRows(json?.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [baseUrl, statusFilter]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/users/getUsers`, { cache: "no-store" });
        const json = await res.json();
        const users: Array<{ id: number; name: string }> = Array.isArray(json?.data) ? json.data : [];
        const opts = users.map((u) => ({ value: String(u.id), label: String(u.name) }));
        setUsersOptions(opts);
      } catch { }
    })();
  }, [baseUrl]);

  async function assign(order_id: number, userId: string) {
    try {
      const res = await fetch(`${baseUrl}/api/deliveries/${order_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_boy_id: Number(userId), status: "assigned" }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.order_id === order_id ? { ...r, delivery_boy_id: Number(userId), status: "assigned", assigned_at: new Date().toISOString() } : r)));
      }
    } catch { }
  }

  async function markDelivered(order_id: number) {
    try {
      const res = await fetch(`${baseUrl}/api/deliveries/${order_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.order_id === order_id ? { ...r, status: "delivered", delivered_at: new Date().toISOString() } : r)));
      }
    } catch { }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Deliveries" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center gap-4 mb-4">
          <Select
            options={[{ value: "", label: "All" }, { value: "pending", label: "Pending" }, { value: "assigned", label: "Assigned" }, { value: "picked_up", label: "Picked Up" }, { value: "delivered", label: "Delivered" }, { value: "failed", label: "Failed" }]}
            defaultValue={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            placeholder="Filter by status"
          />
        </div>
        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading…</div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Order</TableCell>
                    <TableCell isHeader>Delivery Boy</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Assigned At</TableCell>
                    <TableCell isHeader>Delivered At</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>#{r.order_id}</TableCell>
                      <TableCell>
                        <Select
                          options={usersOptions}
                          defaultValue={r.delivery_boy_id ? String(r.delivery_boy_id) : ""}
                          onChange={(v) => assign(r.order_id, v)}
                          placeholder="Assign"
                        />
                      </TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.assigned_at ? new Date(r.assigned_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>{r.delivered_at ? new Date(r.delivered_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => markDelivered(r.order_id)} disabled={r.status === "delivered"}>Mark Delivered</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
