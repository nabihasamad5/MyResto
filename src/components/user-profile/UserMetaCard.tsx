"use client";
import React, { useState, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";


export default function UserMetaCard() {
  const { isOpen: isAvatarOpen, openModal: openAvatarModal, closeModal: closeAvatarModal } = useModal();
  const { userData, loading, refresh } = useUser();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setEmail(userData.email || "");
      setPhone(userData.phone || "");
    }
  }, [userData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
      });

      if (res.ok) {
        await refresh();
        closeAvatarModal();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to upload avatar", err);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) return;
    try {
      setUploading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/users/avatar", {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });

      if (res.ok) {
        await refresh();
        closeAvatarModal();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to delete avatar", err);
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (

    <>
      <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-gray-900 lg:p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className="group relative mb-5 h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-lg transition-transform hover:scale-105 dark:border-gray-800"
            onClick={openAvatarModal}
          >
            <Image
              width={96}
              height={96}
              src={(userData?.avatar || "/images/user/default.png").trim()}
              alt={userData?.name || "User"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <h4 className="mb-1 text-xl font-bold text-gray-800 dark:text-white">
            {loading ? "Loading..." : (userData?.name || "User")}
          </h4>

          <div className="mb-6 flex flex-col gap-1">
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200 mx-auto">
              {userData?.role || "User"}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {userData?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      <Modal isOpen={isAvatarOpen} onClose={closeAvatarModal} className="max-w-[500px] m-4">
        <div className="relative w-full max-w-[500px] bg-white p-6 rounded-3xl dark:bg-gray-900 flex flex-col items-center">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Profile Picture
          </h4>
          <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <Image
              src={(userData?.avatar || "/images/user/default.png").trim()}
              alt="Profile Picture"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex gap-4 w-full justify-center">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload New"}
            </Button>
            {userData?.avatar && !userData.avatar.includes("default") && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                onClick={handleDelete}
                disabled={uploading}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="mt-6 w-full flex justify-end">
            <Button size="sm" variant="outline" onClick={closeAvatarModal}>Close</Button>
          </div>
        </div>
      </Modal>

    </>
  );
}
