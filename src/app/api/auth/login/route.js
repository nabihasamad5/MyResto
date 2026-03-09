import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    // CSRF validation: double-submit cookie
    const headerToken = req.headers.get("x-csrf-token");
    const cookieHeader = req.headers.get("cookie") || "";
    const csrfCookie = cookieHeader
      .split(/;\s*/)
      .map((kv) => kv.split("="))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})["csrf-token"];
    if (!headerToken || !csrfCookie || headerToken !== csrfCookie) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    let email = "";
    let password = "";
    try {
      const body = await req.json();
      email = String(body?.email || "").trim();
      password = String(body?.password || "");
    } catch {
      const form = await req.formData();
      email = String(form.get("email") || "").trim();
      password = String(form.get("password") || "");
    }

    if (!email || !password)
      return NextResponse.json({ error: "All fields required" }, { status: 400 });

    let user = null;
    try {
      const [rows] = await db.execute(
        "SELECT id, name, email, role, phone, avatar, is_active, password_hash FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      user = Array.isArray(rows) ? rows[0] : null;
    } catch (err) {
      const msg = String(err?.message || "");
      if (msg.includes("Unknown column 'password_hash'")) {
        const [rows2] = await db.execute(
          "SELECT id, name, email, role, phone, avatar, is_active, password AS password_hash FROM users WHERE email = ? LIMIT 1",
          [email]
        );
        user = Array.isArray(rows2) ? rows2[0] : null;
      } else {
        throw err;
      }
    }

    if (!user) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (Number(user.is_active) === 0) return NextResponse.json({ error: "Account inactive" }, { status: 403 });

    const hash = user.password_hash;
    let validPass = false;
    if (hash && String(hash).startsWith("$2")) {
      validPass = await bcrypt.compare(password, hash);
    } else if (hash) {
      validPass = password === hash;
    }
    if (!validPass) return NextResponse.json({ error: "Invalid password" }, { status: 400 });

    const secret = process.env.JWT_SECRET || "secret";
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone },
    });

    // Set cookies so middleware can detect authentication globally
    // Use both names for backward compatibility
    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error", details: error?.message }, { status: 500 });
  }
}
