import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getAuthUserId(req) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookiesObj = cookieHeader
      ?.split(/;\s*/)
      .map((kv) => kv.split("="))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const tokenFromCookie = cookiesObj?.token || cookiesObj?.["auth-token"];
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) return null;
    const secret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, secret);
    const id = decoded?.id || decoded?.userId || decoded?.user?.id;
    return typeof id !== "undefined" ? Number(id) : null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const where = [];
    const args = [];
    if (category) {
      where.push("category = ?");
      args.push(String(category));
    }
    if (from) {
      where.push("incurred_at >= ?");
      args.push(String(from));
    }
    if (to) {
      where.push("incurred_at <= ?");
      args.push(String(to));
    }
    const sql = `SELECT id, title, amount, category, incurred_at, notes, created_by, created_at FROM expenses ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY incurred_at DESC, created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch expenses", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const amountNum = Number(body?.amount);
    const amount = Number.isFinite(amountNum) ? amountNum : null;
    const category = body?.category ? String(body.category).trim() : null;
    const incurred_at = body?.incurred_at ? String(body.incurred_at) : null;
    const notes = body?.notes ? String(body.notes).trim() : null;
    if (!title || amount === null) {
      return NextResponse.json({ success: false, error: "title and amount are required" }, { status: 400 });
    }
    const created_by = getAuthUserId(req);
    const [result] = await db.execute(
      "INSERT INTO expenses (title, amount, category, incurred_at, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [title, amount, category, incurred_at, notes, created_by]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, title, amount, category, incurred_at, notes, created_by } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create expense", details: error?.message }, { status: 500 });
  }
}

