"use client";
import React, { useEffect, useState } from "react";
import { Order } from "@/types/global";
import LatestOrder from "@/components/ecommerce/LatestOrders";
import RestaurantMetrics from "@/components/ecommerce/RestaurantMetrics";
import FinanceReportPage from "@/components/ecommerce/FinanceReport";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import LandingPageClient from "../../LandingPageClient";


export default function DashboardHome() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const { userData, loading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setRole(userData?.role ? String(userData.role).toLowerCase() : null);
  }, [userData?.role]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const result = await res.json();
        setOrders(result?.data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    if (role && role !== "customer") fetchOrders();
  }, [role]);

  // useEffect(() => {
  //   if (!loading && role === "customer") {
  //     router.replace("/");
  //   }
  // }, [loading, role, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  if (role === "customer") {
    return (
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <LandingPageClient />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
        {role === "admin" ? <FinanceReportPage /> : null}
        <RestaurantMetrics orders={orders} />
        <StatisticsChart orders={orders} />
      </div>
      <div className="col-span-12 xl:col-span-12">
        <LatestOrder />
      </div>
    </div>
  );
}

