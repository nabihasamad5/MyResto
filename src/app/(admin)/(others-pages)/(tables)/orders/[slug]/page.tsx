import { Metadata } from "next";
import { cookies } from "next/headers";
import React from "react";
import Badge from "@/components/ui/badge/Badge";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  FaCalendarDays,
  FaClock,
  FaLocationDot,
  FaUser,
  FaUtensils,
  FaCircleExclamation,
  FaDollarSign,
  FaPhone
} from "react-icons/fa6";
import OrderFeedback from "@/components/ecommerce/OrderFeedback";

export const metadata: Metadata = {
  title: "Order Details | MyResto",
  description: "Order detail view",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 👇 Fetch from API route (server-side)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // Forward auth token from cookies to authorize server-side fetch
  const cookieStore = await cookies();
  const bearer =
    cookieStore.get("auth-token")?.value || cookieStore.get("token")?.value || "";

  const res = await fetch(`${baseUrl}/api/orders/${slug}`, {
    cache: "no-store",
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
  });
  const result = await res.json();
  const order = result?.data || null;

  // Fetch feedback if order exists
  let feedback = null;
  if (order) {
    const resFeedback = await fetch(`${baseUrl}/api/orders/feedback?order_id=${order.id}`, {
      cache: "no-store",
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
    });
    const feedbackResult = await resFeedback.json();
    feedback = feedbackResult?.data?.[0] || null;
  }

  if (!order) {
    return (
      <div className="p-6">
        <PageBreadcrumb pageTitle="Order Details" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 text-center">
          <div className="flex justify-center mb-4">
            <FaCircleExclamation className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Order Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The requested order could not be found.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "pending") return "warning";
    if (["processing", "accepted", "preparing", "ready"].includes(s)) return "primary";
    if (["completed", "delivered", "served"].includes(s)) return "success";
    if (s === "cancelled") return "error";
    return "light";
  };

  const formatStatus = (status: string) => {
    return String(status).replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
  }

  const isDineIn = String(order.order_type || "").toLowerCase() === "dinein";

  return (
    <div>
      <PageBreadcrumb pageTitle="Order Details" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Order Info & Items */}
        <div className="xl:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                  Order #{order.order_number || order.id}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <FaCalendarDays className="w-4 h-4" />
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge color={getStatusColor(order.status)} size="md">
                  {formatStatus(order.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Totals Card (Since we don't have items yet, we focus on totals) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
              <FaDollarSign className="w-5 h-5 text-gray-500" />
              Payment Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>Rs. {Number(Number(order.total || 0) - Number(order.tax_amount || 0) - Number(order.service_charge || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Tax</span>
                <span>Rs. {Number(order.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Service Charge</span>
                <span>Rs. {Number(order.service_charge || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 my-3"></div>
              <div className="flex justify-between text-base font-semibold text-gray-800 dark:text-white">
                <span>Total</span>
                <span>Rs. {Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Additional Info */}
        <div className="xl:col-span-1 space-y-6">
          {/* Customer Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
              <FaUser className="w-5 h-5 text-gray-500" />
              Customer Details
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-800 text-gray-500">
                  <FaUser className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {isDineIn ? "Dine-in Customer" : (order.customer_name || "Guest")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer Name</p>
                </div>
              </div>

              {(order.customer_email || order.customer_phone) && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-800 text-gray-500">
                    <FaPhone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {order.customer_phone || order.customer_email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Info</p>
                  </div>
                </div>
              )}

              {order.delivery_address && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-800 text-gray-500">
                    <FaLocationDot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {order.delivery_address}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Address</p>
                  </div>
                </div>
              )}

              {isDineIn && order.table_id && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-800 text-gray-500">
                    <FaUtensils className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Table {order.table_id}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dine-in Table</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
              <FaClock className="w-5 h-5 text-gray-500" />
              Timeline
            </h4>
            <div className="relative pl-4 border-l border-gray-200 dark:border-gray-700 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Created</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              {order.placed_at && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 dark:border-gray-900"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Placed</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {new Date(order.placed_at).toLocaleString()}
                  </p>
                </div>
              )}
              {order.completed_at && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-success-500 dark:border-gray-900"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Completed</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {new Date(order.completed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          <OrderFeedback orderId={order.id} initialFeedback={feedback} />
        </div>
      </div>
    </div>
  );
}
