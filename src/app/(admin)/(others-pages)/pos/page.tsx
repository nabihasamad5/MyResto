"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import { useUser } from "@/hooks/useUser";
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

type MenuCategory = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
};

type CartItem = {
  item: MenuItem;
  qty: number;
};

export default function Page() {
  const { userData } = useUser();
  const role = String(userData?.role || "").toLowerCase();
  const allowed = role === "waiter" || role === "manager" || role === "admin";
  const [orderType, setOrderType] = useState<string>("dinein");
  const [tableId, setTableId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Array<{ id: number; name: string; seats: number; location: string; is_active: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [alertVariant, setAlertVariant] = useState<"success" | "error" | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [resItems, resCats, resTables] = await Promise.all([
          fetch("/api/menu/items", { cache: "no-store" }),
          fetch("/api/menu/categories", { cache: "no-store" }),
          fetch("/api/dining-tables?active=1", { cache: "no-store" })
        ]);

        const jsonItems = await resItems.json();
        const jsonCats = await resCats.json();
        const jsonTables = await resTables.json();

        if (resItems.ok && Array.isArray(jsonItems?.data)) {
          if (!cancelled) setMenuItems(jsonItems.data);
        }
        if (resCats.ok && Array.isArray(jsonCats?.data)) {
          if (!cancelled) setCategories(jsonCats.data);
        }
        if (resTables.ok && Array.isArray(jsonTables?.data)) {
          if (!cancelled) setTables(jsonTables.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredMenu = useMemo(() => {
    let result = menuItems;

    // Filter by search
    const s = search.trim().toLowerCase();
    if (s) {
      result = result.filter((m) => m.name.toLowerCase().includes(s));
    }

    // Filter by category
    if (selectedCategory !== "All") {
      result = result.filter((m) => String(m.category_id) === selectedCategory);
    }

    return result;
  }, [search, selectedCategory, menuItems]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  }, [cart]);

  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const serviceCharge = useMemo(() => Math.round(subtotal * 0.02), [subtotal]);
  const total = useMemo(() => subtotal + tax + serviceCharge, [subtotal, tax, serviceCharge]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const decQty = (id: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const qty = next[idx].qty - 1;
      if (qty <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty };
      return next;
    });
  };

  const incQty = (id: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
  };

  function printInvoice() {
    const now = new Date();
    const lines = cart.map((c) => ({
      name: c.item.name,
      qty: c.qty,
      price: c.item.price,
      total: c.item.price * c.qty,
    }));
    const itemsHtml = lines
      .map(
        (l) =>
          `<tr><td style="padding:6px;border-bottom:1px solid #eee">${l.name}</td><td style="padding:6px;text-align:center;border-bottom:1px solid #eee">${l.qty}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #eee">Rs. ${l.price}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #eee">Rs. ${l.total}</td></tr>`
      )
      .join("");
    const tableLabel = orderType === "dinein" ? (tables.find((t) => String(t.id) === String(tableId))?.name || "") : "";
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; color:#111; }
          .container { max-width: 700px; margin: 0 auto; padding: 24px; }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; }
          .brand { font-weight:700; font-size:20px; }
          table { width:100%; border-collapse:collapse; }
          .totals { margin-top: 12px; }
          .totals div { display:flex; justify-content:space-between; padding:4px 0; }
          .footer { margin-top: 18px; font-size:12px; color:#666; }
          @media print {
            .actions { display:none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">MyResto Invoice</div>
            <div>${now.toLocaleString()}</div>
          </div>
          <div style="margin-bottom:8px;">Type: ${orderType}${tableLabel ? " · Table: " + tableLabel : ""}</div>
          <table>
            <thead>
              <tr><th style="text-align:left;padding:6px;border-bottom:2px solid #000">Item</th><th style="text-align:center;padding:6px;border-bottom:2px solid #000">Qty</th><th style="text-align:right;padding:6px;border-bottom:2px solid #000">Price</th><th style="text-align:right;padding:6px;border-bottom:2px solid #000">Total</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><span>Rs. ${subtotal}</span></div>
            <div><span>Tax</span><span>Rs. ${tax}</span></div>
            <div><span>Service</span><span>Rs. ${serviceCharge}</span></div>
            <div style="font-weight:700;"><span>Total</span><span>Rs. ${total}</span></div>
          </div>
          <div class="footer">Thank you for dining with us.</div>
        </div>
        <div class="actions" style="text-align:center;margin-top:12px;">
          <button onclick="window.print()" style="padding:8px 12px;">Print</button>
        </div>
      </body>
    </html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
    }
  }

  const placeOrder = async () => {
    try {
      setSubmitting(true);
      setAlertVariant(null);
      setAlertMessage("");
      if (!allowed) return;
      const normalizedType = String(orderType || "dinein").trim();
      if (!normalizedType) {
        setAlertVariant("error");
        setAlertMessage("Order type is required");
        return;
      }
      let selectedTableId: number | null = null;
      if (orderType === "dinein") {
        selectedTableId = tableId.trim() ? Number(tableId) || null : null;
        if (!selectedTableId && tables.length > 0) {
          selectedTableId = Number(tables[0].id);
          setTableId(String(selectedTableId));
        }
        if (!selectedTableId) {
          setAlertVariant("error");
          setAlertMessage("Select a table for dine-in");
          return;
        }
      }
      const body = {
        order_type: normalizedType,
        table_id: orderType === "dinein" ? selectedTableId : null,
        total_amount: total,
        tax_amount: tax,
        service_charge: serviceCharge,
        discount_amount: 0,
      };
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setCart([]);
        setTableId("");
        setAlertVariant("success");
        setAlertMessage(`Order placed successfully${j?.data?.order_number ? ` (#${j.data.order_number})` : ""}`);
        const res2 = await fetch("/api/dining-tables?active=1", { cache: "no-store" });
        const json2 = await res2.json();
        if (res2.ok && Array.isArray(json2?.data)) setTables(json2.data);
      } else {
        const j = await res.json().catch(() => ({}));
        setAlertVariant("error");
        setAlertMessage(String(j?.error || "Failed to place order"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold dark:text-gray-100">Access denied</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Only waiter, manager and admin can use POS.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-screen">
      <div className="xl:col-span-2 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu"
            className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all ${selectedCategory === "All"
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
              }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(String(c.id))}
              className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all ${selectedCategory === String(c.id)
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMenu.map((m) => {
            const catName = categories.find((c) => c.id === m.category_id)?.name || "General";
            return (
              <button
                key={m.id}
                onClick={() => addToCart(m)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-800"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={m.name}
                      width={320}
                      height={320}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6">
                      <Image
                        src="/images/logo/logo.png"
                        alt={m.name}
                        width={120}
                        height={120}
                        className="opacity-50 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    </div>
                  )}
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900 shadow-sm backdrop-blur-md dark:bg-black/60 dark:text-white">
                    Rs. {m.price}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 text-left">
                  <div className="mb-1 flex items-start justify-between">
                    <h3 className="line-clamp-1 text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 transition-colors">
                      {m.name}
                    </h3>
                  </div>

                  <p className="mb-4 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                    {m.description || `Delicious ${m.name} prepared fresh for you.`}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {catName}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600">
                      Add to Order
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="xl:col-span-1">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex items-center gap-3">
            <select
              value={orderType}
              onChange={(e) => {
                const v = String(e.target.value || "dinein");
                setOrderType(v);
              }}
              className="w-full rounded-lg ring-2 ring-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200 focus:ring-brand-500"
            >
              <option value="dinein">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
            {orderType === "dinein" && (
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="rounded-lg ring-2 ring-gray-300 px-3 py-2 text-sm w-44 dark:bg-gray-800 dark:text-gray-200 focus:ring-brand-500"
              >
                <option value="">Select table</option>
                {tables.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name} · {t.seats} seats · {t.location}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
            {cart.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No items in cart</div>
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
            <div className="flex justify-between text-base">
              <span className="text-gray-700 dark:text-gray-200">Subtotal</span>
              <span className="text-gray-800 dark:text-gray-100">Rs. {subtotal}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-700 dark:text-gray-200">Tax</span>
              <span className="text-gray-800 dark:text-gray-100">Rs. {tax}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-700 dark:text-gray-200">Service</span>
              <span className="text-gray-800 dark:text-gray-100">Rs. {serviceCharge}</span>
            </div>
            <div className="flex justify-between font-semibold mt-2 text-lg">
              <span className="text-gray-800 dark:text-gray-100">Total</span>
              <span className="text-gray-900 dark:text-gray-100">Rs. {total}</span>
            </div>
            <div className="mt-4 space-y-2">
              {alertVariant && (
                <Alert
                  variant={alertVariant}
                  title={alertVariant === "success" ? "Success" : "Error"}
                  message={alertMessage}
                />
              )}
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setCart([])} disabled={submitting || cart.length === 0}>Clear Cart</Button>
                <Button variant="outline" onClick={printInvoice} disabled={cart.length === 0}>Print Invoice</Button>
                <Button onClick={placeOrder} disabled={submitting || cart.length === 0} className="flex-1">
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
