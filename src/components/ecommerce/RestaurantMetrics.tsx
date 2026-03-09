"use client";
import React, { useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import { Order } from "@/types/global";
import { LuBox, LuCookingPot } from "react-icons/lu";
import { AiOutlineFileDone } from "react-icons/ai";
import { MdOutlinePendingActions } from "react-icons/md";


interface RestaurantMetricsProps {
  orders?: Order[];
}

export default function RestaurantMetrics({ orders: ordersProp = [] }: RestaurantMetricsProps) {
  const [orders, setOrders] = useState<Order[]>(ordersProp);
  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL as string;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }, []);

  useEffect(() => {
    setOrders(ordersProp);
  }, [ordersProp]);

  useEffect(() => {
    if (ordersProp && ordersProp.length > 0) return;
    async function load() {
      try {
        const res = await fetch(`${baseUrl}/api/orders`, { cache: "no-store", credentials: "include" });
        const json = await res.json();
        const list: Order[] = Array.isArray(json?.data) ? json.data : [];
        setOrders(list.map((o) => ({
          id: Number(o.id),
          status: String(o.status || "pending").toLowerCase() as Order["status"],
          created_at: String((o).created_at || new Date().toISOString()),
          updated_at: String((o).updated_at || new Date().toISOString()),
          customer_id: (o).customer_id ?? null,
          total: (o).total ?? null,
        })));
      } catch {
        // silently ignore and keep props
      }

    }
    load();
  }, [baseUrl, ordersProp]);
  const report = (status: string = "") => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const filterByMonth = (o: Order, month: number, year: number) => {
      const d = new Date(o.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    };

    const labelFromOrder = (o: Order) => {
      const s = String(o.status || "").toLowerCase();
      if (s === "completed" || s === "delivered") return "Resolved";
      if (s === "processing") return "In Process";
      if (s === "cancelled") return "Rejected";
      return "Pending";
    };

    const matchStatus = (o: Order) =>
      status ? labelFromOrder(o).toLowerCase() === status.toLowerCase() : true;

    const currentMonthCount = orders.filter(
      (o) => filterByMonth(o, currentMonth, currentYear) && matchStatus(o)
    ).length;

    const prevMonthCount = orders.filter(
      (o) => filterByMonth(o, prevMonth, prevYear) && matchStatus(o)
    ).length;

    // No previous data — just show the count
    if (prevMonthCount === 0) return { text: `${currentMonthCount}`, value: 0 };

    const change = ((currentMonthCount - prevMonthCount) / prevMonthCount) * 100;
    return {
      text: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      value: change,
    };
  };

  const renderBadge = (value: number, text: string) => (
    <Badge color={value >= 0 ? "success" : "error"}>
      {value >= 0 ? (
        <ArrowUpIcon className="text-success-500" />
      ) : (
        <ArrowDownIcon className="text-error-500" />
      )}
      {text}
    </Badge>
  );

  const renderMetricCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    reportType: string = ""
  ) => {
    const { text, value: badgeValue } = report(reportType);
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-col items-start">
          <div className="flex item-center justify-between w-full gap-4 mb-1 md:mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {title}
            </span>
            {renderBadge(badgeValue, text)}
          </div>
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-xl dark:bg-gray-800">
              {icon}
            </div>
            <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white/90">
              {value}
            </h4>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* Total Orders */}
        {renderMetricCard(
          "Total Orders",
          orders.length,
          <LuBox className="text-brand-500 size-6 md:size-8 lg:size-10 dark:text-brand-400" />,
          ""
        )}

        {/* Completed Orders */}
        {renderMetricCard(
          "Completed Orders",
          orders.filter((o) => {
            const s = String(o.status || "").toLowerCase();
            return s === "completed" || s === "delivered";
          }).length,
          <AiOutlineFileDone className="text-brand-500 size-6 md:size-8 lg:size-10 dark:text-brand-400" />,
          "Resolved"
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* Processing Orders */}
        {renderMetricCard(
          "Processing Orders",
          orders.filter((o) => {
            const s = String(o.status || "").toLowerCase();
            return s === "preparing";
          }).length,
          <LuCookingPot className="text-brand-500 size-6 md:size-8 lg:size-10 dark:text-brand-400" />,
          "In Process"
        )}

        {/* Pending Orders */}
        {renderMetricCard(
          "Pending Orders",
          orders.filter((o) => {
            const s = String(o.status || "").toLowerCase();
            return s === "created" || s === "accepted";
          }).length,
          <MdOutlinePendingActions className="text-brand-500 size-6 md:size-8 lg:size-10 dark:text-brand-400" />,
          "Pending"
        )}
      </div>
    </>
  );
}
