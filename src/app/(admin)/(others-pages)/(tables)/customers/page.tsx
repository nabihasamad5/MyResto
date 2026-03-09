import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { UserData } from "@/types/global";
import CustomerTable from "./CustomerTable";

export const metadata: Metadata = {
  title: "Customers Table | MyResto ",
  description:
    "This is Next.js Customers Table page for MyResto Tailwind CSS Admin Dashboard",
  // other metadata
};

export default async function CustomersTables() {
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
      <PageBreadcrumb pageTitle="Customers Table" />
      <div className="space-y-6">
        <ComponentCard title="Customers Table">
          <CustomerTable customers={users.filter(u => u.role === "Customer")} />  
        </ComponentCard>
      </div>
    </div>
  );
}
