import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

// Ensure the feedbacks table exists
async function ensureFeedbacksTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        user_id INT NOT NULL,
        menu_item_id INT NULL,
        rating INT NOT NULL,
        comments TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (order_id),
        INDEX (user_id),
        INDEX (menu_item_id)
      )
    `);
  } catch (e) {
    console.error("Failed to ensure feedbacks table:", e);
  }
}

function getAuthUserId(req) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookiesObj = (cookieHeader || "").split(/;\s*/).reduce((acc, kv) => {
      const [k, v] = kv.split("=");
      if (k) acc[k] = v;
      return acc;
    }, {});
    const token = tokenFromHeader || cookiesObj?.token || cookiesObj?.["auth-token"];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return decoded?.id || decoded?.userId || decoded?.user?.id || null;
  } catch (e) {
    return null;
  }
}

export async function POST(req) {
  try {
    await ensureFeedbacksTable();
    const userId = getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, menu_item_id, rating, comments } = body;

    if (!order_id || !rating) {
      return NextResponse.json({ success: false, error: "Missing required fields: order_id, rating" }, { status: 400 });
    }

    // Optional: Verify order exists and belongs to user
    const [orders] = await db.execute("SELECT id FROM orders WHERE id = ? AND user_id = ?", [order_id, userId]);
    if (!Array.isArray(orders) || orders.length === 0) {
        // Wait, if it's a walk-in order, user_id might be null in the orders table.
        // But for feedback, we usually want it linked to a user.
        // Let's check if the order exists at all if user_id check fails for walk-ins
        const [anyOrder] = await db.execute("SELECT id FROM orders WHERE id = ?", [order_id]);
        if (!Array.isArray(anyOrder) || anyOrder.length === 0) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }
    }

    const [result] = await db.execute(
      "INSERT INTO feedbacks (order_id, user_id, menu_item_id, rating, comments) VALUES (?, ?, ?, ?, ?)",
      [order_id, userId, menu_item_id || null, rating, comments || null]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Feedback submitted successfully",
      id: result.insertId 
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req) {
    try {
        await ensureFeedbacksTable();
        const { searchParams } = new URL(req.url);
        const order_id = searchParams.get("order_id");
        const menu_item_id = searchParams.get("menu_item_id");

        let query = "SELECT f.*, u.name as user_name FROM feedbacks f LEFT JOIN users u ON f.user_id = u.id WHERE 1=1";
        const params = [];

        if (order_id) {
            query += " AND f.order_id = ?";
            params.push(order_id);
        }
        if (menu_item_id) {
            query += " AND f.menu_item_id = ?";
            params.push(menu_item_id);
        }

        query += " ORDER BY f.created_at DESC";
        const [rows] = await db.execute(query, params);

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error("Feedback fetch error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
