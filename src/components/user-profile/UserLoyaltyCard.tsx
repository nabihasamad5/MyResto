"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { FaCrown, FaMedal, FaStar } from "react-icons/fa6";

type Tx = { id: number; order_id: number | null; points: number; reason: string; created_at: string };

export default function UserLoyaltyCard() {
  const { userData, loading: userLoading } = useUser();
  const role = String(userData?.role || "").toLowerCase();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [tier, setTier] = useState<string>("");
  const [tx, setTx] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "customer") { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/loyalty/me", { cache: "no-store", credentials: "include" });
        if (!res.ok) {
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          const res2 = await fetch("/api/loyalty/me", {
            cache: "no-store",
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const json2 = await res2.json();
          if (!cancelled) {
            if (res2.ok && json2?.success) {
              setBalance(Number(json2.data?.points || 0));
              setTier(String(json2.data?.tier || ""));
              setTx([]);
              setError(null);
              setLoading(false);
              return;
            } else {
              setError(String(json2?.error || "Failed to fetch loyalty"));
              setLoading(false);
              return;
            }
          }
        }
        const json = await res.json();
        if (!cancelled) {
          if (res.ok && json?.success) {
            setBalance(Number(json.data?.points || 0));
            setTier(String(json.data?.tier || ""));
            setTx([]);
            setError(null);
          } else {
            setError(String(json?.error || "Failed to load loyalty"));
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || "Failed to load loyalty"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [role]);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-gray-900 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Loyalty</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-3 py-1 text-sm bg-brand-500 text-white">{balance} pts</span>
          {tier && (
            <span className="flex items-center gap-1 rounded-full px-3 py-1 text-sm ring-1 ring-gray-300 dark:ring-gray-700 text-gray-700 dark:text-gray-200">
              {String(tier).toLowerCase() === "premium" ? (
                <FaCrown className="w-4 h-4 text-yellow-500" />
              ) : String(tier).toLowerCase() === "silver" ? (
                <FaMedal className="w-4 h-4 text-gray-400" />
              ) : (
                <FaStar className="w-4 h-4 text-gray-500" />
              )}
              {tier}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4">
        {userLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : role !== "customer" ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">This feature is only for customer</div>
        ) : loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-sm text-error-600 dark:text-error-400">{error}</div>
        ) : tx.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No transactions yet</div>
        ) : (
          <div className="space-y-2">
            {tx.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="dark:text-gray-200">
                  {t.reason.replace(/_/g, " ")} {t.order_id ? `#${t.order_id}` : ""}
                </span>
                <span className="dark:text-gray-200">+{t.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
