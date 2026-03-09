"use client";
import React, { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

type FeedbackItem = {
  id: number;
  complaint_id: number;
  user_id: number;
  rating: number | null;
  comment: string;
  created_at: string;
};

export default function RestaurantFeedback({ complaintId }: { complaintId: number }) {
  const { isOpen, openModal, closeModal } = useModal();
  const [feedback, setFeedback] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    if (!complaintId) return;
    const fetchFeedbacks = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/complaints/feedback?complaint_id=${encodeURIComponent(String(complaintId))}` , {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to fetch feedbacks: ${res.status}`);
        const result = await res.json();
        setItems(result?.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load feedbacks");
      }
    };
    fetchFeedbacks();
  }, [complaintId]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsPosting(true);
    setPostError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/complaints/feedback", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ complaint_id: complaintId, rating, comment: feedback }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error || json.message || json.details)) || `Failed to post feedback (${res.status})`;
        throw new Error(msg);
      }
      const { data } = json || {};
      // Prepend new feedback to list
      setItems((prev) => [data, ...prev]);
      setFeedback("");
      setRating(5);
      closeModal();
    } catch (err) {
      console.error(err);
      setPostError(err instanceof Error ? err.message : "Failed to post feedback");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Feedback
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
              {error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              {items.length === 0 && !error && (
                <div className="p-3 rounded-lg border border-transparent">
                  <p className="text-sm text-gray-600 dark:text-gray-400">No feedback yet.</p>
                </div>
              )}
              {items.map((it) => (
                <div key={it.id} className="p-3 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-700 transition">
                  <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    User {it.user_id} • {new Date(it.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {it.comment}
                  </p>
                  {it.rating ? (
                    <span className="mt-1 inline-block text-xs text-gray-500 dark:text-gray-400">Rating: {it.rating}/5</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Add Feedback
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Add Feedback
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Share your feedback or update regarding this complaint.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSubmitFeedback(); }}>
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                {postError && (
                  <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-400">{postError}</p>
                  </div>
                )}
                <div>
                  <Label>Your Feedback</Label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your feedback here..."
                    required
                  />
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" disabled={isPosting}>
                {isPosting ? "Posting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
