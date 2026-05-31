import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessPrediction } from "@/lib/ai";
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
    const authId = getAuthUserId(req);
    
    if (!authId) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const [userRows] = await db.execute("SELECT role FROM users WHERE id = ?", [authId]);
    const role = String(userRows?.[0]?.role || "").toLowerCase();

    if (!["admin", "manager"].includes(role)) {
      return NextResponse.json({ success: false, error: "Access restricted to Admin and Manager roles." }, { status: 403 });
    }
    
    const [rows] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%u') as week,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
      GROUP BY week
      ORDER BY week ASC
    `);

    if (rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {
          trend: "Stable",
          message: "No enough data for prediction.",
          reason: "Not enough order history found in the last 12 weeks.",
          tip: "Start recording more orders to get AI insights!"
        } 
      });
    }

    const prediction = await getBusinessPrediction(rows);
    
    return NextResponse.json({ success: true, data: prediction });
  } catch (error) {
    console.error("Prediction Route Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to generate prediction", 
      details: error.message 
    }, { status: 500 });
  }
}
