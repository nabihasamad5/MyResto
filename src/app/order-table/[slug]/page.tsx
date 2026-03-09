"use client";
import React, { useEffect, useMemo, useState, use } from "react";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

type MenuItem = {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  is_available: number;
  image: string | null;
};

export default function OrderTablePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const slug = String(rawSlug || "");
  const [table, setTable] = useState<{ id: number; name: string; seats: number; location: string; is_active: number } | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertVariant, setAlertVariant] = useState<"success" | "error" | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resT = await fetch(`/api/dining-tables/by-slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
        const jsonT = await resT.json();
        if (resT.ok && jsonT?.data) {
          if (!cancelled) setTable(jsonT.data);
        }
        const resM = await fetch("/api/menu/items", { cache: "no-store" });
        const jsonM = await resM.json();
        if (resM.ok && Array.isArray(jsonM?.data)) {
          if (!cancelled) setMenu(jsonM.data.filter((m: any) => Number(m.is_available) === 1));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.item.price * c.qty, 0), [cart]);
  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const service = useMemo(() => Math.round(subtotal * 0.02), [subtotal]);
  const total = useMemo(() => subtotal + tax + service, [subtotal, tax, service]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1 }];
    });
  }
  function decQty(id: number) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const qty = next[idx].qty - 1;
      if (qty <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty };
      return next;
    });
  }
  function incQty(id: number) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
  }

  async function placeOrder() {
    if (!table) return;
    try {
      setSubmitting(true);
      setAlertVariant(null);
      setAlertMessage("");
      const body = {
        order_type: "dinein",
        table_id: table.id,
        total_amount: total,
        tax_amount: tax,
        service_charge: service,
        discount_amount: 0,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setCart([]);
        setAlertVariant("success");
        setAlertMessage(`Order placed successfully${j?.data?.order_number ? ` (#${j.data.order_number})` : ""}`);
      } else {
        const j = await res.json().catch(() => ({}));
        setAlertVariant("error");
        setAlertMessage(String(j?.error || "Failed to place order"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-600 dark:text-gray-300">Loading…</div>;
  }
  if (!table) {
    return <div className="p-6 text-gray-600 dark:text-gray-300">Table not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Order at {table.name}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Seats: {table.seats} · {table.location || "—"}</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {menu.map((m) => (
              <button
                key={m.id}
                onClick={() => addToCart(m)}
                className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              >
                {m.image ? (
                  <div className="w-48 h-48 mb-2 overflow-hidden rounded-md">
                    <Image src={m.image} alt={m.name} width={320} height={320} className="w-full h-48 object-cover" />
                  </div>
                ) : (
                  <div className="w-48 h-48 mb-2 overflow-hidden rounded-md border">
                    <Image src="/images/logo/logo.png" alt={m.name} width={320} height={320} className="w-full h-48 object-cover" />
                  </div>
                )}
                <div className="font-medium dark:text-gray-100">{m.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rs. {m.price}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="mt-2 space-y-3">
              {cart.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">No items selected</div>
              )}
              {cart.map((c) => (
                <div key={c.item.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium dark:text-gray-100">{c.item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Rs. {c.item.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => decQty(c.item.id)}>-</Button>
                    <span className="w-6 text-center dark:text-gray-100">{c.qty}</span>
                    <Button size="sm" variant="outline" onClick={() => incQty(c.item.id)}>+</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4 dark:border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="dark:text-gray-100">Subtotal</span>
                <span className="dark:text-gray-100">Rs. {subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-gray-100">Tax</span>
                <span className="dark:text-gray-100">Rs. {tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-gray-100">Service</span>
                <span className="dark:text-gray-100">Rs. {service}</span>
              </div>
              <div className="flex justify-between font-semibold mt-2">
                <span className="dark:text-gray-100">Total</span>
                <span className="dark:text-gray-100">Rs. {total}</span>
              </div>
              <div className="mt-4 space-y-2">
                {alertVariant && (
                  <Alert
                    variant={alertVariant}
                    title={alertVariant === "success" ? "Success" : "Error"}
                    message={alertMessage}
                  />
                )}
                <Button onClick={placeOrder} disabled={submitting || cart.length === 0} className="w-full">
                  {submitting ? "Placing..." : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
