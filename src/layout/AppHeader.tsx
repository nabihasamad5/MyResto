"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/80">
      <div className="flex flex-grow items-center justify-between px-4 py-3 shadow-sm md:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H12M4 18H20" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <Link href="/" className="lg:hidden block flex-shrink-0">
            <Image
              width={40}
              height={40}
              src="/images/logo/logo.png"
              alt="Logo"
              className="h-10 w-auto"
            />
          </Link>

          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-800 dark:text-white">
                MyResto
                <span className="ml-2 hidden text-sm font-normal text-gray-500 dark:text-gray-400 xl:inline-block">
                  Restaurant Management System
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Application Menu Toggle */}
          <button
            onClick={toggleApplicationMenu}
            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 lg:hidden"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Desktop & Expanded Mobile Menu */}
          <div className={`${isApplicationMenuOpen ? "absolute top-full left-0 right-0 flex w-full flex-col bg-white p-4 shadow-lg dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" : "hidden"} lg:static lg:flex lg:w-auto lg:flex-row lg:items-center lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none`}>
            <div className="flex items-center justify-end gap-3 sm:gap-4">
              <div className="hidden lg:block h-8 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
              <ThemeToggleButton />
              <NotificationDropdown />
              <div className="hidden sm:block h-8 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
