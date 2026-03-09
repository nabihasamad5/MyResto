import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function ensureInvoices() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      invoice_number VARCHAR(64) UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_method VARCHAR(32) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
      paid_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET() {
  try {
    await ensureInvoices();
    const [rows] = await db.execute(
      `SELECT id, order_id, invoice_number, amount, paid_amount, payment_method, status, created_at, paid_at
       FROM invoices ORDER BY id DESC`
    );
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch invoices", details: e?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ensureInvoices();
    const body = await req.json();
    const order_id = Number(body?.order_id);
    if (!Number.isFinite(order_id)) return NextResponse.json({ success: false, error: "order_id required" }, { status: 400 });
    const [orders] = await db.execute(
      "SELECT total_amount, tax_amount, service_charge FROM orders WHERE id = ?",
      [order_id]
    );
    if (!Array.isArray(orders) || !orders.length) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    const total_amount = Number(orders[0].total_amount || 0);
    const amount = total_amount;
    const invoice_number = `INV-${Date.now()}`;
    const [result] = await db.execute(
      "INSERT INTO invoices (order_id, invoice_number, amount, status, created_at) VALUES (?, ?, ?, 'unpaid', NOW())",
      [order_id, invoice_number, amount]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, order_id, invoice_number, amount } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create invoice", details: e?.message }, { status: 500 });
  }
}

