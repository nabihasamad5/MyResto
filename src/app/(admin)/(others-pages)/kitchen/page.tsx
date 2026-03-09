"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";

type KOrder = {
  id: number;
  order_number: string;
  order_type: string;
  total: number;
  status: string;
  created_at: string;
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<KOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?status=created", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setOrders(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-100">Kitchen Display</h2>
        <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No pending orders</div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-sm border-b py-2 dark:border-gray-800">
              <div className="dark:text-gray-100">
                <span className="font-medium">#{o.order_number}</span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">· {o.order_type}</span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">· Rs. {o.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setStatus(o.id, "in_progress")}>Start</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "ready")}>Ready</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

