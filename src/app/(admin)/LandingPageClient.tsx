"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useUser } from "@/hooks/useUser";

type MenuItem = {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  is_available: number;
  image: string | null;
  prep_time_minutes?: number | null;
  popularity?: number | null;
};

type MenuCategory = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
};

type OrderItem = {
  id: number;
  order_number?: string | null;
  customer_id?: number | null;
  order_type?: string | null;
  total?: number | null;
  status: string;
  created_at: string;
};

export default function LandingPageClient() {
  const { userData } = useUser();
  const userId = userData?.id ? Number(userData.id) : null;
  const role = String(userData?.role || "").toLowerCase();
  const isCustomer = role === "customer";

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number }>>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [alertVariant, setAlertVariant] = useState<"success" | "error" | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [resItems, resCats] = await Promise.all([
          fetch("/api/menu/items", { cache: "no-store" }),
          fetch("/api/menu/categories", { cache: "no-store" }),
        ]);

        const jsonItems = await resItems.json();
        const jsonCats = await resCats.json();

        if (resItems.ok && Array.isArray(jsonItems?.data)) {
          if (!cancelled) setMenuItems(jsonItems.data.filter((m: any) => Number(m.is_available) === 1));
        }
        if (resCats.ok && Array.isArray(jsonCats?.data)) {
          if (!cancelled) setCategories(jsonCats.data);
        }
      } catch (err) {
        console.error("Failed to fetch menu data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let timer: any = null;
    let cancelled = false;
    async function tick() {
      if (!userId) return;
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const json = await res.json();
        const data: OrderItem[] = (json?.data || []).map((o: any) => ({
          id: o.id,
          order_number: o.order_number ?? null,
          customer_id: o.customer_id ?? null,
          order_type: o.order_type ?? null,
          total: o.total ?? null,
          status: String(o.status || "created"),
          created_at: o.created_at,
        }));
        if (!cancelled) {
          setOrders(data.filter((o) => Number(o.customer_id || 0) === Number(userId || 0)));
        }
      } catch { }
    }
    tick();
    timer = setInterval(tick, 10000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [userId]);

  const filteredMenu = useMemo(() => {
    let result = menuItems;
    const s = search.trim().toLowerCase();

    // Filter by search
    if (s) {
      result = result.filter((m) => m.name.toLowerCase().includes(s));
    }

    // Filter by category
    if (activeCategory !== "All") {
      result = result.filter((m) => String(m.category_id) === activeCategory);
    }

    return result;
  }, [search, menuItems, activeCategory]);

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
    if (!isCustomer || !userId) {
      setAlertVariant("error");
      setAlertMessage("Please sign in as a customer to place orders.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setAlertVariant("error");
      setAlertMessage("Please enter a delivery address.");
      return;
    }
    try {
      setSubmitting(true);
      setAlertVariant(null);
      setAlertMessage("");
      const body = {
        order_type: "delivery",
        table_id: null,
        total_amount: total,
        tax_amount: tax,
        service_charge: service,
        discount_amount: 0,
        user_id: userId,
        delivery_address: deliveryAddress.trim(),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setCart([]);
        setDeliveryAddress("");
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

  return (
    <div className="max-w-7xl mx-auto p-0 md:p-0 min-h-screen">
      <section className="px-4 md:px-6 pt-6 pb-4">
        <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">Delicious food, fast ordering</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Browse our menu and place your order in seconds. Sign in to track your orders.</p>
        </div>
      </section>

      <div className="px-4 md:px-6 pb-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu"
                className="w-full rounded-lg ring-1 ring-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("All")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all ${activeCategory === "All"
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                  }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(String(c.id))}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all ${activeCategory === String(c.id)
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                    }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
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

                    <div className="flex flex-1 flex-col p-4 text-left w-full">
                      <div className="mb-1 flex items-start justify-between">
                        <h3 className="line-clamp-1 text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 transition-colors">
                          {m.name}
                        </h3>
                      </div>

                      <p className="mb-4 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                        {m.description || `Delicious ${m.name} prepared fresh for you.`}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800 w-full">
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

          {/* Cart & Orders Section */}
          <div className="xl:col-span-1 space-y-6">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 sticky top-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Your Cart</h3>
              <div className="mb-3">
                <label className="text-sm text-gray-700 dark:text-gray-200">Delivery Address</label>
                <input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  className="mt-1 w-full rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="mt-2 space-y-3 max-h-96 overflow-y-auto pr-1">
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

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Your Orders</h3>
              {orders.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No recent orders</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex flex-col">
                        <span className="font-medium dark:text-gray-200">#{o.order_number || o.id}</span>
                        <span className="text-xs text-brand-500 capitalize">{String(o.status).replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
