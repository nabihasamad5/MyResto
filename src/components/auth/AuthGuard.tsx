"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch("/api/users/me", {
          headers,
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          if (token) localStorage.removeItem("token");
          router.replace("/signin");
          return;
        }
      } catch (err) {
        console.error("AuthGuard error:", err);
        router.replace("/signin");
        return;
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  return <>{children}</>;
}
