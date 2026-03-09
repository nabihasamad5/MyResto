"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { useEffect, useMemo, useState } from "react";
import { Order } from "@/types/global";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Link from "next/link";
import { useFormatRelativeTime } from "@/hooks/DateFormating";

function titleCaseStatus(s: string) {
  const v = s.toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "processing") return "Processing";
  if (v === "completed") return "Completed";
  if (v === "delivered") return "Delivered";
  if (v === "cancelled") return "Cancelled";
  return s;
}

function badgeColor(s: string): "warning" | "primary" | "info" | "success" | "error" {
  const v = s.toLowerCase();
  if (v === "pending") return "warning";
  if (v === "processing") return "primary";
  if (v === "completed") return "success";
  if (v === "delivered") return "success";
  if (v === "cancelled") return "error";
  return "primary";
}

function RelativeTime({ date }: { date: string }) {
  const time = useFormatRelativeTime(date);
  return <>{time}</>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, { name: string; phone?: string; email?: string }>>({});

  async function fetchOrders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch("/api/orders", {
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const json = await res.json();
    const list: Order[] = Array.isArray(json?.data) ? json.data : [];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(list);
  }

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users/getUsers", { cache: "no-store" });
        const json = await res.json();
        const map: Record<string, { name: string; phone?: string; email?: string }> = {};
        for (const u of json?.data || []) {
          const id = String(u.id);
          map[id] = {
            name: String(u.name || u.email || u.id),
            phone: u?.phone ? String(u.phone) : "",
            email: u?.email ? String(u.email) : undefined,
          };
        }
        setUsersMap(map);
      } catch { }
    }
    fetchUsers();
  }, []);

  return (
    <div>
      <PageBreadcrumb pageTitle="Orders" />
      <div className="space-y-6">
        <ComponentCard title="Orders List">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Orders</h3>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Order</TableCell>
                    <TableCell isHeader>Customer</TableCell>
                    <TableCell isHeader>Total</TableCell>
                    <TableCell isHeader>Order Type</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Date</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell># {order.id}</TableCell>
                      <TableCell>
                        <Link href={`orders/${order.id}`} key={order.id} className="group">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90 group-hover:underline underline-offset-4 ">
                              {(() => {
                                const name = order.customer_name || undefined;
                                if (name && name.trim().length) return name;
                                if (order.customer_id != null) {
                                  const u = usersMap[String(order.customer_id)];
                                  if (u?.name && u.name.trim().length) return u.name;
                                  return `Customer #${order.customer_id}`;
                                }
                                return "Dine-in";
                              })()}
                            </span>
                            <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {(() => {
                                const p = order.customer_phone;
                                if (p && String(p).trim().length) return String(p);
                                if (order.customer_id != null) {
                                  const u = usersMap[String(order.customer_id)];
                                  return u?.phone ?? "";
                                }
                                return "";
                              })()}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {order.total != null ? `${Number(order.total).toFixed(2)}` : "0.00"}
                      </TableCell>
                      <TableCell>
                        {order.order_type ? String(order.order_type).replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : "Not Found"}
                      </TableCell>
                      <TableCell>
                        <Badge size="sm" color={badgeColor(order.status)}>
                          {order.status === "out_for_delivery" ? "Out For Delivery" : titleCaseStatus(order.status).toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RelativeTime date={order.created_at} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
