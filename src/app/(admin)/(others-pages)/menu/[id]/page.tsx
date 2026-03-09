"use client";
import React, { useEffect, useMemo, useState, use } from "react";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useUser } from "@/hooks/useUser";
import { FaStar, FaTrash } from "react-icons/fa6";
import { useFormatRelativeTime } from "@/hooks/DateFormating";

type MenuItem = {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  is_available: number;
  image: string | null;
};
type Feedback = {
  id: number;
  order_id: number | null;
  user_id: number | null;
  menu_item_id: number | null;
  rating: number;
  comments: string;
  created_at: string;
  user_name?: string | null;
};

function RelativeTime({ date }: { date: string }) {
  const time = useFormatRelativeTime(date);
  return <>{time}</>;
}

export default function MenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const itemId = Number(id);
  const { userData } = useUser();
  const role = String(userData?.role || "").toLowerCase();
  const userId = userData?.id ? Number(userData.id) : null;
  const canReview = role === "customer";
  const canDelete = (feedbackUserId: number | null) => {
    if (!userId) return false;
    if (role === "admin" || role === "manager") return true;
    return Number(feedbackUserId) === userId;
  };

  const [item, setItem] = useState<MenuItem | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "info" | "warning" | null>(null);

  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avgRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const sum = feedbacks.reduce((s, f) => s + Number(f.rating || 0), 0);
    return Math.round((sum / feedbacks.length) * 10) / 10;
  }, [feedbacks]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/menu/items/${itemId}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) setItem(json.data);
      const res2 = await fetch(`/api/feedbacks?menu_item_id=${itemId}`, { cache: "no-store" });
      const json2 = await res2.json();
      if (res2.ok && json2?.success) setFeedbacks(json2.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [itemId]);

  async function deleteFeedback(feedbackId: number) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      setVariant(null); setMessage("");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`/api/feedbacks?id=${feedbackId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setVariant("success"); setMessage("Feedback deleted");
        await load();
      } else {
        setVariant("error"); setMessage(String(json?.error || "Failed to delete feedback"));
      }
    } catch (e: any) {
      setVariant("error"); setMessage(String(e?.message || "Failed to delete feedback"));
    }
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setVariant(null); setMessage("");
      if (!canReview || !userId) {
        setVariant("error"); setMessage("Only customers can review items");
        return;
      }
      const payload = {
        order_id: null,
        user_id: userId,
        menu_item_id: itemId,
        rating: Number(rating),
        comments: comments.trim(),
      };
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setVariant("success"); setMessage("Feedback submitted");
        setRating(2); setComments("");
        await load();
      } else {
        setVariant("error"); setMessage(String(json?.error || "Failed to submit feedback"));
      }
    } catch (e: any) {
      setVariant("error"); setMessage(String(e?.message || "Failed to submit feedback"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !item) {
    return <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <div className="w-60 h-60 overflow-hidden rounded-lg border dark:border-gray-800">
            {item.image ? (
              <Image src={item.image} alt={item.name} width={320} height={320} className="w-full h-60 object-cover" />
            ) : (
              <Image src="/images/logo/logo.png" alt={item.name} width={320} height={320} className="w-full h-60 object-cover" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold dark:text-gray-100">{item.name}</h1>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Rs. {item.price}</div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description || "No description"}</div>
            <div className="mt-3 text-sm dark:text-gray-100">Average rating: {avgRating} ({feedbacks.length} reviews)</div>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold dark:text-gray-100">Reviews</h2>
          {feedbacks.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</div>
          ) : (
            <div className="mt-2 space-y-2">
              {feedbacks.map((f) => (
                <div key={f.id} className="rounded-lg border p-3 dark:border-gray-800 relative group">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-medium dark:text-gray-100">
                      {f.user_name || "Customer"}
                      <span className="mx-1 lg:mx-5"> ·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        <RelativeTime date={f.created_at} />
                      </span>
                    </div>
                    {canDelete(f.user_id) && (
                      <button
                        onClick={() => deleteFeedback(f.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete review"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize pr-8">{f.comments}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <FaStar
                        key={n}
                        className={`w-3 h-3 ${n <= f.rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
                        fill={n <= f.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-gray-100 mb-4">Add your review</h3>
        {variant && <Alert variant={variant} title={variant === "success" ? "Success" : "Error"} message={message} />}
        {canReview ? (
          <form onSubmit={submitFeedback} className="space-y-3">
            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`p-1 rounded ${n <= rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
                  >
                    <FaStar className="w-5 h-5" fill={n <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Comments</Label>
              <TextArea rows={4} value={comments} onChange={(val) => setComments(val)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Submitting..." : "Submit"}</Button>
          </form>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">Sign in as a customer to post a review.</div>
        )}
      </div>
    </div>
  );
}
