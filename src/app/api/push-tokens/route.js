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
    const userIdParam = searchParams.get("user_id");
    const where = [];
    const args = [];
    if (userIdParam) {
      const v = Number(userIdParam);
      if (!Number.isNaN(v)) {
        where.push("user_id = ?");
        args.push(v);
      }
    }
    const sql = `SELECT id, user_id, token, platform, created_at FROM push_tokens ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch tokens", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const user_id = getAuthUserId(req) ?? Number(body?.user_id);
    const token = String(body?.token || "").trim();
    const platform = body?.platform ? String(body.platform).trim() : null;
    if (!Number.isFinite(user_id) || !token) {
      return NextResponse.json({ success: false, error: "user_id and token are required" }, { status: 400 });
    }
    const [result] = await db.execute(
      "INSERT INTO push_tokens (user_id, token, platform, created_at) VALUES (?, ?, ?, NOW())",
      [user_id, token, platform]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, user_id, token, platform } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save token", details: error?.message }, { status: 500 });
  }
}

