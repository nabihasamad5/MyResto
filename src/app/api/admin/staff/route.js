import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const ALLOWED_ROLES = new Set(["Waiter", "Delivery", "Manager", "Admin"]);

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");
    const role = String(body?.role || "").trim();
    const phone = String(body?.phone || "").trim();
    const gender = String(body?.gender || "").trim();
    const avatar = String(body?.avatar || body?.image || "").trim();
    const address = String(body?.address || "").trim();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (role, name, email, phone, gender, password_hash, avatar, address, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
      [role, name, email, phone, gender, hashed, avatar, address]
    );

    return NextResponse.json({ success: true, message: "User added" }, { status: 201 });
  } catch (error) {
    console.error("Error adding staff:", error);
    return NextResponse.json({ success: false, error: error?.message || "Server error" }, { status: 500 });
  }
}
