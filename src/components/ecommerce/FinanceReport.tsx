"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";

type FinanceData = {
  orders: { orders_count: number; orders_total: number; tax_total: number; service_total: number };
  expenses: { expenses_count: number; expenses_total: number };
  profit: number;
};

export default function FinanceReportPage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await fetch(`/api/reports/finance?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-gray-100">Finance Report</h2>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200" />
          <Button size="sm" variant="outline" onClick={load}>Filter</Button>
        </div>
      </div>
      {loading || !data ? (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 ">
          <div className="rounded-lg border p-4 dark:border-gray-800 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">Orders</div>
            <div className="text-xl font-semibold dark:text-gray-100">{data.orders.orders_count}</div>
            <div className="text-sm dark:text-gray-100">Revenue Rs. {data.orders.orders_total}</div>
          </div>
          <div className="rounded-lg border p-4 dark:border-gray-800 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">Expenses</div>
            <div className="text-xl font-semibold dark:text-gray-100">{data.expenses.expenses_count}</div>
            <div className="text-sm dark:text-gray-100">Spent Rs. {data.expenses.expenses_total}</div>
          </div>
          <div className="rounded-lg border p-4 dark:border-gray-800 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">Profit</div>
            <div className="text-xl font-semibold dark:text-gray-100">Rs. {data.profit}</div>
          </div>
        </div>
      )}
    </div>
  );
}

