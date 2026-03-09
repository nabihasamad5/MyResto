import React from "react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { UserData } from "@/types/global";

interface StaffTableProps {
  staff?: UserData[] | null;
}
export default function StaffTable({ staff = [] }: StaffTableProps) {
  const safeStaff = Array.isArray(staff) ? staff : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Name</TableCell>
                <TableCell isHeader>Phone</TableCell>
                <TableCell isHeader>Email</TableCell>
                <TableCell isHeader>Address</TableCell>
                <TableCell isHeader>Active</TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {safeStaff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <Image
                          width={40}
                          height={40}
                          src={staffMember?.avatar || "/images/user/default.png"}
                          alt={staffMember?.name || ""}
                        />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {staffMember.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {staffMember.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {staffMember.phone}
                  </TableCell>
                  <TableCell>
                    {staffMember.email}
                  </TableCell>
                  <TableCell>
                    {staffMember.address}
                  </TableCell>
                  <TableCell>
                    <Badge
                      size="sm"
                      color={staffMember.is_active ? "success" : "error"}
                    >
                      {staffMember.is_active ? "Yes" : "No"}
                    </Badge>
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
