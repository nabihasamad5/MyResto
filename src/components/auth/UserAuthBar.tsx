"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function UserAuthBar() {
  const { userData, loading } = useUser();
  const router = useRouter();

  const name = userData?.name || "";
  const email = userData?.email || "";
  const avatar = userData?.avatar || "/images/logo/logo.png";

  async function signOut() {
    try {
      const res = await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
      if (res.ok) {
        router.replace("/signin");
      } else {
        router.replace("/signin");
      }
    } catch {
      router.replace("/signin");
    }
  }

  if (loading) {
    return null;
  }

  if (!userData) {
    return (
      <Link
        href="/signin"
        className="px-5 py-2 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-all shadow-sm hover:shadow-md"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-full bg-gray-100 dark:bg-white/[0.06]"
      aria-label="Authenticated user information"
    >
      <div className="flex items-center gap-3">
        <Image
          src={avatar}
          alt={name ? `${name}'s profile picture` : "Profile picture"}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white" aria-label="username">{name}</span>
          <span className="text-xs text-gray-600 dark:text-gray-300" aria-label="email">{email}</span>
        </div>
      </div>
      <button
        onClick={signOut}
        className="ml-2 px-3 py-1.5 rounded-full bg-brand-600 text-white text-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        aria-label="Sign out"
      >
        Sign Out
      </button>
    </div>
  );
}

