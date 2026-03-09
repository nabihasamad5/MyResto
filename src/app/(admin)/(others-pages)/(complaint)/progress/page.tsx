"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OrderStatus } from "@/types/global";
import { useUser } from "@/hooks/useUser";
import {
  LuClock,
  LuUser,
  LuFileText,
  LuBox,
  LuClipboardList,
  LuCheck,
} from "react-icons/lu";
import { MdDoneOutline, MdOutlineCancel, MdOutlineDeliveryDining, MdOutlinePendingActions } from "react-icons/md";
import { BiDish } from "react-icons/bi";
import { FaRoute } from "react-icons/fa6";

type OrderItem = {
  id: number;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  order_type?: string | null;
  total?: number | null;
  status: OrderStatus;
  assigned_to?: number | null;
  created_at: string;
};

// Simplified color mapping for a cleaner look
const statusStyles: Record<
  OrderStatus,
  { bg: string; text: string; border: string; icon: React.ElementType }
> = {
  created: {
    bg: "bg-gray-50 dark:bg-white/5",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-800",
    icon: LuClipboardList,
  },
  accepted: {
    bg: "bg-brand-50 dark:bg-brand-500/10",
    text: "text-brand-500 dark:text-brand-400",
    border: "border-brand-100 dark:border-brand-500/20",
    icon: LuBox,
  },
  preparing: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-500 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-500/20",
    icon: MdOutlinePendingActions,
  },
  ready: {
    bg: "bg-teal-50 dark:bg-teal-500/10",
    text: "text-teal-500 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-500/20",
    icon: LuCheck,
  },
  served: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-500 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-500/20",
    icon: BiDish,
  },
  out_for_delivery: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-500 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-500/20",
    icon: MdOutlineDeliveryDining,
  },
  delivered: {
    bg: "bg-success-50 dark:bg-success-500/10",
    text: "text-success-500 dark:text-success-400",
    border: "border-success-100 dark:border-success-500/20",
    icon: FaRoute,
  },
  cancelled: {
    bg: "bg-error-50 dark:bg-error-500/10",
    text: "text-error-500 dark:text-error-400",
    border: "border-error-100 dark:border-error-500/20",
    icon: MdOutlineCancel,
  },
  completed: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
    icon: MdDoneOutline,
  },
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 604800;
  if (interval > 1) return Math.floor(interval) + "w ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min";
  return "just now";
}

export default function Progress() {
  const { userData } = useUser();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [userMap, setUserMap] = useState<Record<number, { name: string; role?: string }>>({});
  const [live, setLive] = useState<boolean>(true);
  const [evt, setEvt] = useState<EventSource | null>(null);

  // Fetch initial orders
  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      try {
        const res = await fetch(`${baseUrl}/api/orders`, { cache: "no-store" });
        const json = await res.json();
        const data: OrderItem[] = (json?.data || []).map((o: any) => ({
          id: o.id,
          order_number: o.order_number ?? null,
          customer_name: o.customer_name ?? null,
          customer_email: o.customer_email ?? null,
          customer_phone: o.customer_phone ?? null,
          order_type: o.order_type ?? null,
          total: o.total ?? null,
          status: String(o.status || "created") as OrderStatus,
          assigned_to: o.assigned_to ?? null,
          created_at: o.created_at,
        }));
        if (!cancelled) setOrders(data);
      } catch { }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, []);

  // Polling fallback
  useEffect(() => {
    let timer: any = null;
    let cancelled = false;
    async function tick() {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      try {
        const res = await fetch(`${baseUrl}/api/orders`, { cache: "no-store" });
        const json = await res.json();
        const data: OrderItem[] = (json?.data || []).map((o: any) => ({
          id: o.id,
          order_number: o.order_number ?? null,
          customer_name: o.customer_name ?? null,
          customer_email: o.customer_email ?? null,
          customer_phone: o.customer_phone ?? null,
          order_type: o.order_type ?? null,
          total: o.total ?? null,
          status: String(o.status || "created") as OrderStatus,
          assigned_to: o.assigned_to ?? null,
          created_at: o.created_at,
        }));
        if (!cancelled) setOrders(data);
      } catch { }
    }
    if (live) {
      tick();
      timer = setInterval(tick, 5000);
    }
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [live]);

  // Live updates via SSE
  useEffect(() => {
    let es: EventSource | null = null;
    if (live) {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      es = new EventSource(`${baseUrl}/api/orders/updates`);
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.type === "updated") {
            const id = Number(payload?.id);
            const status = String(payload?.status || "");
            if (Number.isFinite(id) && status) {
              setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as OrderStatus } : o)));
            }
          } else if (payload?.type === "created" && payload?.order) {
            const o = payload.order;
            const mapped: OrderItem = {
              id: Number(o.id),
              order_number: o.order_number ?? null,
              customer_name: null,
              customer_email: null,
              customer_phone: null,
              order_type: o.order_type ?? null,
              total: o.total ?? null,
              status: String(o.status || "created") as OrderStatus,
              assigned_to: o.assigned_to ?? null,
              created_at: o.created_at,
            };
            setOrders((prev) => {
              const exists = prev.some((x) => x.id === mapped.id);
              return exists ? prev : [mapped, ...prev];
            });
          }
        } catch { }
      };
      setEvt(es);
    }
    return () => {
      if (es) {
        es.close();
      }
      setEvt(null);
    };
  }, [live]);

  // Fetch users for mapping
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      try {
        const res = await fetch(`${baseUrl}/api/users/getUsers`, { cache: "no-store" });
        const json = await res.json();
        const users = Array.isArray(json?.data) ? json.data : [];
        const m: Record<number, { name: string; role?: string }> = {};
        users.forEach((u: any) => {
          const idNum = Number(u?.id);
          if (Number.isFinite(idNum)) m[idNum] = { name: String(u?.name || ""), role: String(u?.role || "") };
        });
        if (!cancelled) setUserMap(m);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);

  const role = String(userData?.role || "").toLowerCase();
  const userId = userData?.id ? Number(userData.id) : null;
  const viewableOrders = useMemo(() => {
    if (role === "waiter" || role === "delivery") {
      return orders.filter((o) => Number(o.assigned_to || 0) === Number(userId || 0));
    }
    if (role === "admin" || role === "manager" || role === "kitchen") return orders;
    return [];
  }, [orders, role, userId]);

  const allColumns: OrderStatus[] = [
    "created",
    "accepted",
    "preparing",
    "ready",
    "served",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "completed",
  ];

  const columns: OrderStatus[] = useMemo(() => {
    if (role === "waiter") return ["created", "accepted", "ready", "served", "completed", "cancelled"];
    if (role === "delivery") return ["accepted", "out_for_delivery", "delivered", "cancelled"];
    if (role === "kitchen") return ["preparing", "ready", "out_for_delivery"];
    return allColumns;
  }, [role]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.dataTransfer.setData("text/plain", String(id));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: OrderStatus) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const id = Number(idStr);
    (async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      try {
        const res = await fetch(`${baseUrl}/api/orders/update-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus }),
        });
        if (!res.ok) throw new Error("Update failed");
        // Optimistic update or refresh
        const res2 = await fetch(`${baseUrl}/api/orders`, { cache: "no-store" });
        const json2 = await res2.json();
        const data2: OrderItem[] = (json2?.data || []).map((o: any) => ({
          id: o.id,
          order_number: o.order_number ?? null,
          customer_name: o.customer_name ?? null,
          customer_email: o.customer_email ?? null,
          customer_phone: o.customer_phone ?? null,
          order_type: o.order_type ?? null,
          total: o.total ?? null,
          status: String(o.status || "created") as OrderStatus,
          assigned_to: o.assigned_to ?? null,
          created_at: o.created_at,
        }));
        setOrders(data2);
      } catch (err) { }
    })();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const printInvoice = (o: OrderItem) => {
    const now = new Date();
    const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8" />
    <title>Invoice</title>
    <style>
    body { font-family: Arial, sans-serif; color:#111; }
    .container { max-width: 700px; margin: 0 auto; padding: 24px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; }
    .brand { font-weight:700; font-size:20px; }
    table { width:100%; border-collapse:collapse; }
    .totals { margin-top: 12px; }
    .totals div { display:flex; justify-content:space-between; padding:4px 0; }
    .footer { margin-top: 18px; font-size:12px; color:#666; }
    @media print { .actions { display:none; } }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MyResto Invoice</div>
          <div>${now.toLocaleString()}</div>
        </div>
        <div style="margin-bottom:8px;">Order #${o.order_number || o.id} · ${String(o.order_type || "").replace(/_/g, " ")}</div>
        <div style="margin-bottom:8px;">Status: ${String(o.status || "").replace(/_/g, " ")}</div>
        <table>
          <thead><tr><th style="text-align:left;padding:6px;border-bottom:2px solid #000">Description</th><th style="text-align:right;padding:6px;border-bottom:2px solid #000">Amount</th></tr></thead>
          <tbody>
            <tr><td style="padding:6px;border-bottom:1px solid #eee">Total</td><td style="padding:6px;text-align:right;border-bottom:1px solid #eee">Rs. ${Number(o.total || 0).toFixed(0)}</td></tr>
          </tbody>
        </table>
        <div class="footer">Generated from Orders Progress.</div>
      </div>
      <div class="actions" style="text-align:center;margin-top:12px;">
        <button onclick="window.print()" style="padding:8px 12px;">Print</button>
      </div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
    }
  };

  return (
    <div className="overflow-hidden">
      <PageBreadcrumb pageTitle="Orders Progress" />

      {/* Status Overview Cards */}
      <div className="mt-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
          {columns.map((status) => {
            const count = viewableOrders.filter((o) => o.status === status).length;
            const style = statusStyles[status];
            return (
              <div
                key={status}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${style.bg} ${style.border} transition-all hover:shadow-sm`}
              >
                <span className={`text-xl font-bold ${style.text}`}>{count}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${style.text} opacity-80 mt-1`}>
                  {status.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 h-full overflow-x-auto custom-scrollbar pb-4">
          {columns.map((status) => {
            const style = statusStyles[status];
            const items = viewableOrders.filter((o) => o.status === status);
            const StatusIcon = style.icon;

            return (
              <div
                key={status}
                onDrop={(e) => handleDrop(e, status)}
                onDragOver={handleDragOver}
                className="flex-shrink-0 w-full lg:w-[320px] bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex flex-col lg:max-h-[calc(100vh-220px)]"
              >
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900/50 z-10 py-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${style.bg} ${style.border} border`}>
                      <StatusIcon className={`w-5 h-5 ${style.text}`} />
                    </div>
                    <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                      {status.replace(/_/g, " ")}
                    </h2>
                  </div>
                  <span className="bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-500 border border-gray-100 dark:border-gray-700 shadow-sm">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1">
                  {items.map((o) => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, o.id)}
                      className="group bg-white dark:bg-gray-800 rounded-xl p-4 cursor-move shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-200 relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-400 mb-0.5">Order #{o.order_number || o.id}</span>
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                            {o.customer_name || "Walk-in Customer"}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${style.bg} ${style.text}`}>
                          {o.order_type || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md">
                            <span className="text-xs font-medium">Rs. {Number(o.total || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => printInvoice(o)}
                            className="text-gray-400 hover:text-brand-500 transition-colors"
                            title="Print Invoice"
                          >
                            <LuFileText className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <LuClock className="w-3.5 h-3.5" />
                          {timeAgo(o.created_at)}
                        </span>

                        {o.assigned_to ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700" title={`Assigned to ${userMap[o.assigned_to]?.name}`}>
                            <LuUser className="w-3.5 h-3.5 text-brand-500" />
                            <span className="font-medium text-gray-600 dark:text-gray-300 max-w-[80px] truncate">
                              {o.assigned_to === userId ? "You" : (userMap[o.assigned_to]?.name || `Staff #${o.assigned_to}`)}
                            </span>
                          </div>
                        ) : (
                          <span className="italic opacity-50">Unassigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl text-center">
                      <p className="text-xs text-gray-400">No Orders</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
