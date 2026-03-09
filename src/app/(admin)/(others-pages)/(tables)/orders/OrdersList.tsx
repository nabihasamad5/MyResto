"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";

export default function OrdersList({ orders }: { orders: any[] }) {
  const [rows, setRows] = useState<any[]>(orders || []);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL as string;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }, []);

  useEffect(() => {
    setRows(orders || []);
  }, [orders]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/users/getUsers`, { cache: "no-store" });
        const json = await res.json();
        const map: Record<string, string> = {};
        for (const u of json?.data || []) {
          const idStr = String(u.id);
          const nameStr = String(u.name || u.email || u.id);
          map[idStr] = nameStr;
        }
        setUsersMap(map);
      } catch { }
    })();
  }, [baseUrl]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Order</TableCell>
                <TableCell isHeader>Customer</TableCell>
                <TableCell isHeader>Type</TableCell>
                <TableCell isHeader>Total</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Assigned To</TableCell>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/orders/${o.order_number || o.id}`} className="text-brand-500">#{o.order_number || o.id}</Link>
                  </TableCell>
                  <TableCell>
                    {String(o.order_type || "").toLowerCase() === "dinein"
                      ? `Dine-in Customer${o.table_id ? ` · Table ${o.table_id}` : ""}`
                      : (o.customer_name || o.customer_email || o.customer_phone || "—")}
                  </TableCell>
                  <TableCell>{o.order_type || "—"}</TableCell>
                  <TableCell>Rs. {Number(o.total || 0).toFixed(0)}</TableCell>
                  <TableCell>
                    <Badge size="sm" color={o.status === "cancelled" ? "error" : o.status === "completed" ? "success" : "primary"}>
                      <span className="whitespace-nowrap">{String(o.status || "").replace(/_/g, " ")}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {o.assigned_to ? (usersMap[String(o.assigned_to)] ?? String(o.assigned_to)) : "Not Assigned"}
                  </TableCell>
                  <TableCell>{o.created_at}</TableCell>
                  <TableCell>
                    <Link href={`/orders/${o.order_number || o.id}`} className="text-brand-500">View</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

