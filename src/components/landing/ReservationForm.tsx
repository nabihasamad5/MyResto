"use client";
import React from "react";

export default function ReservationForm() {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const reserved_for_date = String(fd.get("date") || "");
    const reserved_for_time = String(fd.get("time") || "");
    const reserved_for = `${reserved_for_date} ${reserved_for_time}:00`;
    const guests = Number(fd.get("guests") || 1);
    const notes = String(fd.get("notes") || "");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: null,
          table_id: null,
          reserved_for,
          guests,
          status: "pending",
          notes,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string })?.error || "Failed to create reservation");
      }
      setMessage("Reservation submitted. We will confirm shortly.");
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-gray-200 dark:border-white/10 p-4 bg-white dark:bg-gray-900"
      aria-label="Reservation form"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
        <input
          type="date"
          name="date"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 p-2"
        />
      </div>
      <div>
        <label className="block text-sm font_medium text-gray-700 dark:text-gray-200">Time</label>
        <input
          type="time"
          name="time"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Guests</label>
        <input
          type="number"
          name="guests"
          min={1}
          defaultValue={2}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 p-2"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Notes</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Any special requests?"
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 p-2"
        />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-medium"
        >
          {loading ? "Submitting..." : "Make Reservation"}
        </button>
        {message && <span className="text-green-600">{message}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </form>
  );
}

