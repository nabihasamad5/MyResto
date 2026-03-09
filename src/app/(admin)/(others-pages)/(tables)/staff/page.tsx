import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import StaffListClient from "./StaffListClient";
import { UserData } from "@/types/global";

export const metadata: Metadata = {
  title: "Staff | MyResto ",
  description:
    "This is Next.js Staff page for MyResto Admin Dashboard",
  // other metadata
};

export default async function StudentsTables() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/users/getUsers`, {
    cache: "no-store",
  });
  const result = await res.json();
  const users: UserData[] = result?.data || [];
  return (
    <div>
      <PageBreadcrumb pageTitle="Staff" />
      <div className="space-y-6">
        <ComponentCard title="Staff Table">
          <StaffListClient users={users.filter(u => u.role === "Waiter" || u.role === "Delivery")} />
        </ComponentCard>
      </div>
    </div>
  );
}
