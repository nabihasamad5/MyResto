import React from "react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
// import Badge from "@/components/ui/badge/Badge";
import { UserData } from "@/types/global";

interface CustomerTableProps {
  customers?: UserData[] | null;
}
export default function CustomerTable({ customers = [] }: CustomerTableProps) {
  const safeCustomers = Array.isArray(customers) ? customers : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Customer</TableCell>
                <TableCell isHeader>Phone</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Gender</TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {safeCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <Image
                          width={40}
                          height={40}
                          src={customer.image || "/images/user/default.png"}
                          alt={customer.name || ""}
                        />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {customer.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.phone}
                  </TableCell>
                  <TableCell>
                    {/* <Badge
                      size="sm"
                      color={
                        customer.status === "Resolved"
                          ? "success"
                          : customer.status === "Pending"
                          ? "warning"
                          : "primary"
                      }
                    >
                      {customer.status}
                    </Badge> */}
                    {customer.address}
                  </TableCell>
                  <TableCell>
                    {customer.gender}
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
