"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";

type PerfRow = {
  staff_id: number;
  name: string | null;
  role: string | null;
  email: string | null;
  orders_count: number;
  revenue: number;
  avg_minutes: number;
};

export default function StaffPerformancePage() {
  const [rows, setRows] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await fetch(`/api/staff/performance?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setRows(json.data || []);
      } else {
        setError(String(json?.error || "Failed to load performance"));
      }
    } catch (e: any) {
      setError(String(e?.message || "Failed to load performance"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Staff Performance</h2>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200" />
          <Button size="sm" variant="outline" onClick={load}>Filter</Button>
        </div>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-sm text-error-600 dark:text-error-400">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left dark:text-gray-200">
                <th className="px-2 py-2">Staff</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Orders</th>
                <th className="px-2 py-2">Revenue</th>
                <th className="px-2 py-2">Avg minutes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.staff_id} className="border-t dark:border-gray-800">
                  <td className="px-2 py-2 dark:text-gray-100">{r.name || r.staff_id}</td>
                  <td className="px-2 py-2 dark:text-gray-100">{r.role || "-"}</td>
                  <td className="px-2 py-2 dark:text-gray-100">{r.orders_count}</td>
                  <td className="px-2 py-2 dark:text-gray-100">Rs. {r.revenue}</td>
                  <td className="px-2 py-2 dark:text-gray-100">{Math.round(r.avg_minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

