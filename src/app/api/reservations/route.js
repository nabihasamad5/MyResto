import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function ensureReservations() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      customer_name VARCHAR(255) NULL,
      table_id INT NULL,
      reserved_for DATETIME NOT NULL,
      guests INT NOT NULL DEFAULT 1,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      notes TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  // Attempt to add customer_name column if the table already exists but lacks the column
  try {
    await db.execute("ALTER TABLE reservations ADD COLUMN customer_name VARCHAR(255) NULL");
  } catch (e) {
    // Column likely already exists
  }
}

export async function GET(req) {
  try {
    await ensureReservations();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const where = [];
    const args = [];
    if (status) { where.push("status = ?"); args.push(status); }
    if (from) { where.push("reserved_for >= ?"); args.push(from); }
    if (to) { where.push("reserved_for <= ?"); args.push(to); }
    const [rows] = await db.execute(
      `SELECT r.id, r.user_id, r.customer_name, r.table_id, r.reserved_for, r.guests, r.status, r.notes, r.created_at, r.updated_at,
              u.name as user_name, u.email as user_email
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY r.reserved_for DESC, r.id DESC`, args
    );
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch reservations", details: e?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ensureReservations();
    const body = await req.json();
    const user_id = body?.user_id ? Number(body.user_id) : null;
    const customer_name = body?.customer_name ? String(body.customer_name).trim() : null;
    const table_id = body?.table_id ? Number(body.table_id) : null;

    let reserved_for = body?.reserved_for;
    if (!reserved_for && body?.date && body?.time) {
      reserved_for = `${body.date} ${body.time}`;
    }
    reserved_for = String(reserved_for || "").replace("T", " ");

    const guests = Number(body?.guests || 1);
    const status = String(body?.status || "pending");
    const notes = body?.notes ? String(body.notes).trim() : null;

    if (!reserved_for || !Number.isFinite(guests) || guests <= 0) {
      return NextResponse.json({ success: false, error: "Invalid reservation data" }, { status: 400 });
    }

    // Optional: Check if date is valid
    if (isNaN(new Date(reserved_for).getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date/time format" }, { status: 400 });
    }

    const [result] = await db.execute(
      `INSERT INTO reservations (user_id, customer_name, table_id, reserved_for, guests, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [user_id, customer_name, table_id, reserved_for, guests, status, notes]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create reservation", details: e?.message }, { status: 500 });
  }
}

