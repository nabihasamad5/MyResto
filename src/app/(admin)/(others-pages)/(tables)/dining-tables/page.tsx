"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { useUser } from "@/hooks/useUser";

type DiningTable = {
  id: number;
  name: string;
  seats: number;
  location: string | null;
  qr_code_slug?: string | null;
  is_active: number;
  created_at?: string;
};

export default function DiningTablesPage() {
  const { userData } = useUser();
  const role = String(userData?.role || "").toLowerCase();
  const canManage = role === "admin" || role === "manager" || role === "waiter";
  const [rows, setRows] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dining-tables", { cache: "no-store" });
        const json = await res.json();
        const data: DiningTable[] = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) setRows(data);
      } catch (e: any) {
        if (!cancelled) setError("Failed to load tables");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeCount = useMemo(() => rows.filter((r) => Number(r.is_active) === 1).length, [rows]);

  async function toggleActive(id: number, nextActive: number) {
    try {
      setUpdating(id);
      setError(null);
      const res = await fetch(`/api/dining-tables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(String(j?.error || "Failed to update"));
      }
      const j = await res.json();
      const updated = Number(j?.data?.is_active);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: updated } : r)));
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Dining Tables" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Tables</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">Active: {activeCount} / {rows.length}</div>
        </div>
        {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
        {loading ? (
          <div className="py-6 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>ID</TableCell>
                      <TableCell isHeader>Name</TableCell>
                      <TableCell isHeader>Seats</TableCell>
                      <TableCell isHeader>Location</TableCell>
                      <TableCell isHeader>Status</TableCell>
                      <TableCell isHeader>Action</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.seats}</TableCell>
                        <TableCell>{r.location || "—"}</TableCell>

                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${Number(r.is_active) === 1 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300"}`}>
                            {Number(r.is_active) === 1 ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={!canManage || updating === r.id}
                            onClick={() => toggleActive(r.id, Number(r.is_active) === 1 ? 0 : 1)}
                          >
                            {Number(r.is_active) === 1 ? (updating === r.id ? "Deactivating…" : "Deactivate") : (updating === r.id ? "Activating…" : "Activate")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
