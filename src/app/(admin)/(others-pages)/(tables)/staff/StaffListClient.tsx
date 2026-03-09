"use client";
import React, { useMemo, useState } from "react";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import StaffTable from "./StaffTable";
import { UserData } from "@/types/global";

export default function StaffListClient({ users }: { users: UserData[] }) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "waiter" | "delivery">("all");

  const filtered = useMemo(() => {
    const lowerQ = q.trim().toLowerCase();
    return users
      .filter((u) => {
        const r = String(u.role || "").toLowerCase();
        if (roleFilter === "waiter" && r !== "waiter") return false;
        if (roleFilter === "delivery" && r !== "delivery") return false;
        return true;
      })
      .filter((u) => {
        if (!lowerQ) return true;
        const name = String(u.name || "").toLowerCase();
        const email = String(u.email || "").toLowerCase();
        const phone = String(u.phone || "").toLowerCase();
        return name.includes(lowerQ) || email.includes(lowerQ) || phone.includes(lowerQ);
      });
  }, [users, q, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name, email or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-sm"
          type="text"
        />
        <div className="flex gap-2">
          <Button size="sm" variant={roleFilter === "all" ? "primary" : "outline"} onClick={() => setRoleFilter("all")}>All</Button>
          <Button size="sm" variant={roleFilter === "waiter" ? "primary" : "outline"} onClick={() => setRoleFilter("waiter")}>Waiters</Button>
          <Button size="sm" variant={roleFilter === "delivery" ? "primary" : "outline"} onClick={() => setRoleFilter("delivery")}>Delivery</Button>
        </div>
      </div>
      <StaffTable staff={filtered} />
    </div>
  );
}

