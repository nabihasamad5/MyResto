"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { FaTrash } from "react-icons/fa";

type Invoice = {
  id: number;
  order_id: number;
  invoice_number: string;
  amount: number;
  paid_amount: number;
  payment_method: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export default function InvoicesPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "info" | "warning" | null>(null);
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/invoices", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) setList(json.data || []);
      else { setVariant("error"); setMessage(String(json?.error || "Failed to load invoices")); }
    } catch (e: any) {
      setVariant("error"); setMessage(String(e?.message || "Failed to load invoices"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setVariant(null); setMessage("");
      const id = Number(orderId);
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: id }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setVariant("success"); setMessage("Invoice created");
        setOrderId("");
        await load();
      } else {
        setVariant("error"); setMessage(String(json?.error || "Failed to create invoice"));
      }
    } catch (e: any) {
      setVariant("error"); setMessage(String(e?.message || "Failed to create invoice"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteInvoice(id: number) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setVariant("success");
        setMessage("Invoice deleted successfully");
        load();
      } else {
        setVariant("error");
        setMessage(json.error || "Failed to delete invoice");
      }
    } catch (e: any) {
      setVariant("error");
      setMessage(e.message || "Failed to delete invoice");
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold dark:text-gray-100">Invoices</h2>
          <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No invoices</div>
        ) : (
          <div className="space-y-2">
            {list.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-sm border-b py-2 dark:border-gray-800">
                <div className="dark:text-gray-100">{inv.invoice_number} for Order {inv.order_id}</div>
                <div className="flex items-center gap-3">
                  <div className="dark:text-gray-100">Total Rs. {inv.amount}</div>
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete Invoice"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-gray-100 mb-4">Create Invoice</h3>
        {variant && <Alert variant={variant} title={variant === "success" ? "Success" : "Error"} message={message} />}
        <form onSubmit={create} className="space-y-3">
          <div><Label>Order ID</Label><Input type="number" value={orderId} onChange={(e) => setOrderId(e.target.value)} /></div>
          <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Creating..." : "Create"}</Button>
        </form>
      </div>
    </div>
  );
}

