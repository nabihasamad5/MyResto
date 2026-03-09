"use client";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserLoyaltyCard from "@/components/user-profile/UserLoyaltyCard";
import React from "react";

// Metadata moved to layout file

export default function Profile() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Cover Section */}
      <div className="relative mb-8 h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg dark:from-black dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="relative flex h-full flex-col justify-end px-6 py-6 z-10 lg:px-8">
          <h3 className="text-3xl font-bold text-white shadow-sm tracking-tight">Profile Settings</h3>
          <p className="mt-2 text-sm font-medium text-gray-200/80 max-w-md hidden sm:block">
            Manage your personal information, address, and loyalty status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          <UserMetaCard />
          <UserLoyaltyCard />
        </div>

        {/* Right Content */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}
