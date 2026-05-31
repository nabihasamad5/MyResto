"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import { MenuItem } from "@/types/global";

interface PopularPicksProps {
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export default function PopularPicks({ menuItems, onAddToCart }: PopularPicksProps) {
  const topRatedItems = useMemo(() => {
    const sorted = [...menuItems].sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
    const hasPopularity = sorted.some(m => (Number(m.popularity) || 0) > 0);
    // If no items have popularity > 0, just show the first 5 items as "Picks for you"
    return hasPopularity ? sorted.filter(m => (Number(m.popularity) || 0) > 0).slice(0, 5) : sorted.slice(0, 5);
  }, [menuItems]);

  if (menuItems.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          Popular Picks
        </h2>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {menuItems.some(m => (Number(m.popularity) || 0) > 0) ? "Most Ordered" : "Featured"}
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
        {topRatedItems.map((m) => (
          <button
            key={`top-${m.id}`}
            onClick={() => onAddToCart(m)}
            className="flex w-[180px] md:w-[200px] lg:w-[220px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/30 p-3 transition-all hover:border-orange-300 hover:bg-orange-50 dark:border-orange-900/20 dark:bg-orange-900/10 dark:hover:bg-orange-900/20"
          >
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-white dark:bg-gray-800">
              {m.image ? (
                <Image
                  src={m.image}
                  alt={m.name}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-4">
                  <Image
                    src="/images/logo/logo.png"
                    alt={m.name}
                    width={60}
                    height={60}
                    className="opacity-30"
                  />
                </div>
              )}
              <div className="absolute top-2 left-2 rounded-lg bg-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                TOP RATED
              </div>
            </div>
            <div className="flex flex-1 flex-col text-left">
              <h3 className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-gray-100">{m.name}</h3>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Rs. {m.price}</span>
                <div className="flex items-center gap-1 text-orange-500">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  <span className="text-[10px] font-bold">{Number(m.popularity) || 0} Orders</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
