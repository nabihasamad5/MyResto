"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useUser } from "@/hooks/useUser";
import toast from 'react-hot-toast';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  created_at: string;
  creator_name?: string;
  creator_image?: string | null;
  is_read?: number;
  type?: "announcement" | "notification";
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useUser();
  // const audioRef = useRef<HTMLAudioElement | null>(null);

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL as string;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }, []);

  // Initialize audio context ref
  // const audioRef = useRef<HTMLAudioElement | null>(null); // Removed file-based audio

  const playSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Nice "ding" sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop pitch

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5); // Fade out

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  /*
  useEffect(() => {
    audioRef.current = new Audio(notificationSound);
    audioRef.current.volume = 0.5;
  }, []);
  */

  useEffect(() => {
    let cancelled = false;
    let lastId = 0;

    async function fetchAll() {
      try {
        // Fetch Announcements
        const res1 = await fetch(`${baseUrl}/api/admin/announcements`, { cache: "no-store" });
        const announcements = res1.ok ? await res1.json() : [];
        const mappedAnnouncements: NotificationItem[] = (Array.isArray(announcements) ? announcements : []).map((a: any) => ({
          id: Number(a?.id) + 100000, // Offset ID to avoid collision
          title: String(a?.title || ""),
          message: String(a?.message || ""),
          created_at: String(a?.createdAt || ""),
          creator_name: String(a?.creator?.name || ""),
          creator_image: a?.creator?.image || null,
          type: "announcement"
        }));

        // Fetch User Notifications
        let mappedNotifications: NotificationItem[] = [];
        if (userData?.id) {
          const res2 = await fetch(`${baseUrl}/api/notifications`, { cache: "no-store" });
          const notifications = res2.ok ? await res2.json() : { data: [] };
          mappedNotifications = (Array.isArray(notifications?.data) ? notifications.data : []).map((n: any) => ({
            id: Number(n?.id),
            title: String(n?.title || ""),
            message: String(n?.message || ""),
            created_at: String(n?.created_at || ""),
            creator_name: "System",
            creator_image: null,
            is_read: Number(n?.is_read || 0),
            type: "notification"
          }));
        }

        const combined = [...mappedNotifications, ...mappedAnnouncements].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        if (!cancelled) {
          // Check for new notifications to play sound
          const latest = combined[0];
          if (latest && latest.type === "notification" && latest.id > lastId && lastId !== 0) {
            playSound();
            toast.custom((t) => (
              <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <Image
                        className="h-10 w-10 rounded-full object-cover"
                        src={latest.creator_image || "/images/user/default.png"}
                        alt=""
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {latest.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {latest.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-brand-500 hover:text-brand-600 focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), { duration: 5000 });
          }
          if (latest && latest.id > lastId) lastId = latest.id;

          setItems(combined);
          const unreadCount = mappedNotifications.filter(n => n.is_read === 0).length;
          setHasUnread(unreadCount > 0);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    const interval = setInterval(fetchAll, 10000); // Poll every 10 seconds

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [baseUrl, userData?.id]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen && hasUnread) {
      // Mark as read logic could go here
      setHasUnread(false);
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        onClick={toggleDropdown}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${!hasUnread ? "hidden" : "flex"
            }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="text-center text-gray-500 dark:text-gray-400 py-4">Loading…</li>
          ) : items.length === 0 ? (
            <li className="text-center text-gray-500 dark:text-gray-400 py-4">No notifications</li>
          ) : (
            items.map((n) => (
              <li key={n.id}>
                <DropdownItem
                  onItemClick={() => {
                    // Optional: mark as read logic
                  }}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${n.type === 'notification' && n.is_read === 0 ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <Image
                      width={40}
                      height={40}
                      src={n.creator_image || "/images/user/default.png"}
                      alt="User"
                      className="w-full overflow-hidden rounded-full"
                    />
                    <span className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${n.type === 'notification' ? 'bg-blue-500' : 'bg-success-500'}`}></span>
                  </span>
                  <span className="block">
                    <span className="mb-1.5 capitalize space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                      <span className=" font-medium text-gray-800 dark:text-white/90">
                        {n.title}
                      </span>
                      <span className="capitalize">{n.message}</span>
                    </span>
                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span>{n.creator_name || ""}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{(() => {
                        const created = new Date(n.created_at);
                        const now = new Date();
                        const diffMs = now.getTime() - created.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHrs = Math.floor(diffMins / 60);
                        if (diffMins < 1) return "Just now";
                        if (diffMins < 60) return `${diffMins} min ago`;
                        return `${diffHrs} hr ago`;
                      })()}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
