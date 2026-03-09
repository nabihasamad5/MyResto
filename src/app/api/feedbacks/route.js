import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

async function ensureFeedbacks() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NULL,
      user_id INT NOT NULL,
      menu_item_id INT NOT NULL,
      rating INT NOT NULL,
      comments TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (menu_item_id),
      INDEX (user_id)
    )
  `);
}

export async function GET(req) {
  try {
    await ensureFeedbacks();
    const { searchParams } = new URL(req.url);
    const orderIdParam = searchParams.get("order_id");
    const menuItemIdParam = searchParams.get("menu_item_id");
    const userIdParam = searchParams.get("user_id");
    const where = [];
    const args = [];
    if (orderIdParam) {
      const v = Number(orderIdParam);
      if (!Number.isNaN(v)) {
        where.push("f.order_id = ?");
        args.push(v);
      }
    }
    if (menuItemIdParam) {
      const v = Number(menuItemIdParam);
      if (!Number.isNaN(v)) {
        where.push("f.menu_item_id = ?");
        args.push(v);
      }
    }
    if (userIdParam) {
      const v = Number(userIdParam);
      if (!Number.isNaN(v)) {
        where.push("f.user_id = ?");
        args.push(v);
      }
    }
    const sql = `
      SELECT 
        f.id, f.order_id, f.user_id, f.menu_item_id, f.rating, f.comments, f.created_at,
        u.name AS user_name
      FROM feedbacks f
      LEFT JOIN users u ON u.id = f.user_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY f.created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch feedbacks", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ensureFeedbacks();
    const body = await req.json();
    const order_id = body?.order_id !== undefined ? Number(body.order_id) : null;
    const menu_item_id = body?.menu_item_id !== undefined ? Number(body.menu_item_id) : null;
    const ratingNum = Number(body?.rating);
    const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, ratingNum)) : null;
    const comments = String(body?.comments || "").trim();
    let user_id = getAuthUserId(req) ?? (body?.user_id !== undefined ? Number(body.user_id) : null);
    if (!user_id) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) user_id = Number(session.user.id);
      } catch { }
    }
    if (!user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!rating || !comments || !menu_item_id) {
      return NextResponse.json({ success: false, error: "rating, comments and menu_item_id are required" }, { status: 400 });
    }
    // Ensure user and menu item exist to satisfy FK constraints
    try {
      const [u] = await db.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [user_id]);
      if (!Array.isArray(u) || u.length === 0) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
    } catch { }
    try {
      const [mi] = await db.execute("SELECT id FROM menu_items WHERE id = ? LIMIT 1", [menu_item_id]);
      if (!Array.isArray(mi) || mi.length === 0) {
        return NextResponse.json({ success: false, error: "Menu item not found" }, { status: 404 });
      }
    } catch { }
    let orderVal = null;
    if (Number.isFinite(order_id) && order_id > 0) {
      try {
        const [ord] = await db.execute("SELECT id FROM orders WHERE id = ? LIMIT 1", [order_id]);
        if (Array.isArray(ord) && ord.length) {
          orderVal = order_id;
        } else {
          orderVal = null;
        }
      } catch {
        orderVal = null;
      }
    }
    const [result] = await db.execute(
      "INSERT INTO feedbacks (order_id, user_id, menu_item_id, rating, comments, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [orderVal, user_id, menu_item_id, rating, comments]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, order_id, user_id, menu_item_id, rating, comments } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create feedback", details: error?.message || "unknown" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    let authId = getAuthUserId(req);
    if (!authId) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) authId = Number(session.user.id);
      } catch { }
    }
    if (!authId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check user role
    const [users] = await db.execute("SELECT role FROM users WHERE id = ?", [authId]);
    const role = String(users?.[0]?.role || "").toLowerCase();
    const isAdminOrManager = role === "admin" || role === "manager";

    // Get feedback author
    const [rows] = await db.execute("SELECT user_id FROM feedbacks WHERE id = ?", [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Feedback not found" }, { status: 404 });
    }
    const authorId = rows[0].user_id;

    if (!isAdminOrManager && authorId !== authId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await db.execute("DELETE FROM feedbacks WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete feedback", details: error?.message }, { status: 500 });
  }
}
