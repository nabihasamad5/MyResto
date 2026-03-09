"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { FaTrash } from "react-icons/fa";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string | null;
  incurred_at: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
};

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Expense[]>([]);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "info" | "warning" | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [incurredAt, setIncurredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/expenses", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setList(json.data || []);
      } else {
        setVariant("error");
        setMessage(String(json?.error || "Failed to load expenses"));
      }
    } catch (e: any) {
      setVariant("error");
      setMessage(String(e?.message || "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setVariant(null);
    setMessage("");

    // Validation
    if (!title.trim()) {
      setVariant("error");
      setMessage("Title is required.");
      setSubmitting(false);
      return;
    }
    const amountVal = Number(amount);
    if (!amount || isNaN(amountVal) || amountVal <= 0) {
      setVariant("error");
      setMessage("Please enter a valid amount greater than 0.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        amount: amountVal,
        category: category.trim() || null,
        incurred_at: incurredAt || null,
        notes: notes.trim() || null,
      };
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setVariant("success");
        setMessage("Expense added");
        setTitle(""); setAmount(""); setCategory(""); setIncurredAt(""); setNotes("");
        await load();
      } else {
        setVariant("error");
        setMessage(String(json?.error || "Failed to add expense"));
      }
    } catch (e: any) {
      setVariant("error");
      setMessage(String(e?.message || "Failed to add expense"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteExpense(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setVariant("success");
        setMessage("Expense deleted successfully");
        load();
      } else {
        setVariant("error");
        setMessage(json.error || "Failed to delete expense");
      }
    } catch (e: any) {
      setVariant("error");
      setMessage(e.message || "Failed to delete expense");
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Expenses</h2>
          <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No expenses recorded</div>
        ) : (
          <div className="space-y-2">
            {list.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between text-sm border-b py-2 dark:border-gray-800">
                <div className="dark:text-gray-100">
                  <span className="font-medium">{ex.title}</span>
                  {ex.category && <span className="ml-2 text-gray-500 dark:text-gray-400">· {ex.category}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="dark:text-gray-100">Rs. {ex.amount}</div>
                  <button
                    onClick={() => deleteExpense(ex.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete Expense"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Add Expense</h3>
        {variant && <Alert variant={variant} title={variant === "success" ? "Success" : "Error"} message={message} />}
        <form onSubmit={addExpense} className="space-y-3">
          <div>
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Expense Title" />
          </div>
          <div>
            <Label>Amount <span className="text-red-500">*</span></Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., utilities, supplies" />
          </div>
          <div>
            <Label>Incurred At</Label>
            <Input type="date" value={incurredAt} onChange={(e) => setIncurredAt(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details..." />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>
    </div>
  );
}

