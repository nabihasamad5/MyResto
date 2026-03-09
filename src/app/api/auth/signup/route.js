import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const fname = String(body?.fname || "").trim();
    const lname = String(body?.lname || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");
    const gender = String(body?.gender || "").trim();
    const address = String(body?.address || "").trim();
    const avatar = String(body?.avatar || "").trim();

    if (!fname || !lname || !phone || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const [user] = await db.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (Array.isArray(user) && user.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (role, name, email, phone, gender, password_hash, avatar, address, is_active, created_at, updated_at) VALUES ('Customer', ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
      [`${fname} ${lname}`, email, phone, gender, hashedPassword, avatar, address]
    );

    return NextResponse.json({ success: true, message: "Account created successfully!" });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error", details: error?.message }, { status: 500 });
  }
}
