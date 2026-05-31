"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { FaStar } from "react-icons/fa6";

interface OrderFeedbackProps {
  orderId: number | string;
  initialFeedback?: any;
}

export default function OrderFeedback({ orderId, initialFeedback }: OrderFeedbackProps) {
  const [rating, setRating] = useState(initialFeedback?.rating || 5);
  const [comments, setComments] = useState(initialFeedback?.comments || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!initialFeedback);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/orders/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          rating,
          comments
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-success-200 bg-success-50 p-5 dark:border-success-900/30 dark:bg-success-900/10 lg:p-6">
        <h4 className="text-base font-semibold text-success-700 dark:text-success-400 mb-2">Thank you for your feedback!</h4>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <FaStar key={s} className={s <= rating ? "text-orange-400" : "text-gray-300"} />
          ))}
        </div>
        <p className="text-sm text-success-600 dark:text-success-400 italic">"{comments || "No comments"}"</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">How was your experience?</h4>
      
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-2xl transition-colors ${rating >= star ? "text-orange-400" : "text-gray-200 dark:text-gray-700 hover:text-orange-200"}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Tell us what you liked or how we can improve..."
        className="w-full rounded-xl border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-brand-500 dark:border-gray-800 dark:text-white h-24 resize-none mb-4"
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}
