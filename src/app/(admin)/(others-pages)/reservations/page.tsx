"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";

type Resv = {
  id: number;
  user_id: number | null;
  customer_name?: string;
  user_name?: string;
  table_id: number | null;
  reserved_for: string;
  guests: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function ReservationsPage() {
  const [list, setList] = useState<Resv[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "info" | "warning" | null>(null);

  // Split date and time states
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/reservations", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setList(json.data || []);
      } else {
        setVariant("error"); setMessage(String(json?.error || "Failed to load reservations"));
      }
    } catch (e: any) {
      setVariant("error"); setMessage(String(e?.message || "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleEdit(r: Resv) {
    setEditingId(r.id);
    const d = new Date(r.reserved_for);
    setDate(d.toISOString().split("T")[0]);
    // HH:MM format
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    setTime(`${h}:${m}`);
    setGuests(String(r.guests));
    setNotes(r.notes || "");
    setCustomerName(r.customer_name || (r.user_name || ""));
    setVariant(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this reservation?")) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setList(prev => prev.filter(x => x.id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (e) { }
  }

  function resetForm() {
    setEditingId(null);
    setDate(""); setTime(""); setGuests("2"); setNotes(""); setCustomerName("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setVariant(null);
    setMessage("");

    // Validation
    if (!date) {
      setVariant("error"); setMessage("Please select a date."); setSubmitting(false); return;
    }
    if (!time) {
      setVariant("error"); setMessage("Please select a time."); setSubmitting(false); return;
    }
    const guestCount = Number(guests);
    if (!guests || isNaN(guestCount) || guestCount <= 0) {
      setVariant("error"); setMessage("Guests must be at least 1."); setSubmitting(false); return;
    }

    try {
      // Combine date and time
      const datetime = `${date}T${time}`;

      const payload = {
        date, time, // Send separately just in case, or API handles it
        reserved_for: datetime, // Some APIs prefer this
        guests: guestCount,
        status: "pending",
        notes: notes.trim() || null,
        customer_name: customerName,
        user_id: null // We are now doing manual entry
      };

      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/reservations/${editingId}` : "/api/reservations";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setVariant("success");
        setMessage(editingId ? "Reservation updated" : "Reservation created");
        resetForm();
        await load();
      } else {
        setVariant("error");
        setMessage(String(json?.error || "Failed to save reservation"));
      }
    } catch (e: any) {
      setVariant("error");
      setMessage(String(e?.message || "Failed to save reservation"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold dark:text-gray-100">Reservations</h2>
          <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No reservations</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <th className="py-2 px-3">Sr.</th>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Start Time</th>
                  <th className="py-2 px-3">Guests</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r, index) => {
                  const dateObj = new Date(r.reserved_for);
                  const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={r.id} className="border-b dark:border-gray-800 text-sm dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="py-3 px-3">#{index + 1}</td>
                      <td className="py-3 px-3 font-medium text-gray-800 dark:text-white/90">
                        {r.customer_name || r.user_name || (r.user_id ? `User #${r.user_id}` : "Guest")}
                      </td>
                      <td className="py-3 px-3">{dateStr}</td>
                      <td className="py-3 px-3">{r.guests}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(r)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-gray-100">{editingId ? "Update Reservation" : "Add Reservation"}</h3>
          {editingId && <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
        {variant && <Alert variant={variant} title={variant === "success" ? "Success" : "Error"} message={message} />}
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Customer Name</Label>
            <Input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Time <span className="text-red-500">*</span></Label>
              <Input type="text" placeholder="HH:MM" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Guests <span className="text-red-500">*</span></Label>
            <Input type="number" value={guests} onChange={(e) => setGuests(e.target.value)} min="1" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requests..." />
          </div>
          <Button type="submit" disabled={submitting} className="w-full text-white">{submitting ? (editingId ? "Updating..." : "Saving...") : (editingId ? "Update" : "Save")}</Button>
        </form>
      </div>
    </div>
  );
}

