"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { useUser } from "@/hooks/useUser";
import { Announcement } from "@/types/global";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaBullhorn, FaPaperPlane, FaTrash, FaUserCircle, FaClock } from "react-icons/fa";

// Utility for relative time
function getRelativeTime(dateString: string) {
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function AnnouncementPage() {
  const { userData } = useUser();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  // Fetch announcements on mount
  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/admin/announcements", {
        headers: { "Connection": "keep-alive" },
        cache: 'no-store'
      });
      if (res.ok) {
        const data: Announcement[] = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch('/api/admin/announcements/postAnnouncement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), created_by: userData?.id || "" }),
      });

      if (!res.ok) throw new Error('Failed to post announcement');

      const saved = await res.json();

      // Optimistic update or refetch
      const newAnnouncement: Announcement = {
        id: saved.id,
        title: saved.title,
        message: saved.message,
        created_by: saved.created_by,
        createdAt: saved.createdAt,
        creator: {
          image: saved?.creator?.image ?? "",
          name: saved?.creator?.name ?? "Me",
          email: saved?.creator?.email ?? "",
        },
      };

      setAnnouncements([newAnnouncement, ...announcements]);
      setTitle("");
      setMessage("");
      setSubmitStatus("success");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        setDeleteStatus("Deleted successfully");
        setTimeout(() => setDeleteStatus(null), 3000);
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting announcement");
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <PageBreadcrumb pageTitle="Announcements" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* Left Column: Create Announcement */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                <FaBullhorn size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">New Announcement</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share updates with your team</p>
              </div>
            </div>

            {submitStatus === "success" && (
              <Alert variant="success" title="Posted!" message="Your announcement is live." />
            )}
            {submitStatus === "error" && (
              <Alert variant="error" title="Error" message="Could not post announcement." />
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System Maintenance"
                  className="bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="message">Message</Label>
                <TextArea
                  value={message}
                  onChange={(val) => setMessage(val)}
                  rows={6}
                  placeholder="What would you like to say?"
                  className="bg-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white transition-all
                  ${submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-brand-600 hover:bg-brand-700 active:scale-[0.98] shadow-md hover:shadow-lg"
                  }`}
              >
                {submitting ? "Posting..." : <><FaPaperPlane /> Post Update</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Updates</h3>
              <button
                onClick={fetchAnnouncements}
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
              >
                Refresh
              </button>
            </div>

            {deleteStatus && <div className="mb-4 text-green-600 text-sm">{deleteStatus}</div>}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[600px]">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading feed...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <FaBullhorn className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={32} />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No announcements yet</p>
                  <p className="text-xs text-gray-400">Be the first to post something!</p>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="group relative bg-gray-50 dark:bg-gray-700/20 hover:bg-white dark:hover:bg-gray-700/40 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {ann.creator?.image ? (
                          <div className="relative">
                            <Image
                              src={ann.creator.image}
                              alt={ann.creator.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                            <FaUserCircle />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {ann.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{ann.creator?.name || 'Unknown'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><FaClock size={10} /> {getRelativeTime(ann.createdAt)}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(ann.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {ann.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
