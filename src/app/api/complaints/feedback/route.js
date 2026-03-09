import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

// Ensure the feedback table exists to avoid runtime 500s if schema wasn't applied
async function ensureFeedbackTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT feedback_ibfk_1 FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      )
    `);
  } catch (e) {
    // Surface a clear error to help diagnose DB issues
    throw new Error(`Failed to ensure feedback table: ${e?.message || String(e)}`);
  }
}

function getAuthUserId(req) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookiesObj = cookieHeader
      ?.split(/;\s*/)
      .map((kv) => kv.split("="))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const tokenFromCookie = cookiesObj?.token || cookiesObj?.["auth-token"]; // support both names
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) return null;
    const secret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, secret);
    const id = decoded?.id || decoded?.userId || decoded?.user?.id;
    return typeof id !== "undefined" ? Number(id) : null;
  } catch (e) {
    return null;
  }
}

export async function POST(req) {
  try {
    await ensureFeedbackTable();
    const userId = getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawRestaurant = body?.complaint_id;
    const isNumericId = rawRestaurant !== null && rawRestaurant !== undefined && !Number.isNaN(Number(rawRestaurant));
    let complaintNumericId = null;
    if (isNumericId) {
      complaintNumericId = Number(rawRestaurant);
    } else {
      const complaintStr = String(rawRestaurant || "").trim();
      if (!complaintStr) {
        return NextResponse.json(
          { success: false, error: "Missing required field: complaint_id" },
          { status: 400 }
        );
      }
      // Map string complaint_id to numeric complaints.id
      const [mapRows] = await db.execute("SELECT id FROM complaints WHERE complaint_id = ?", [complaintStr]);
      if (!Array.isArray(mapRows) || mapRows.length === 0) {
        return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
      }
      complaintNumericId = Number(mapRows[0]?.id);
    }
    const comment = String(body?.comment || "").trim();
    const ratingNum = Number(body?.rating);
    const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, ratingNum)) : null;

    if (!complaintNumericId || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: complaint_id, comment" },
        { status: 400 }
      );
    }

    // Optional: validate complaint exists
    const [cRows] = await db.execute("SELECT id FROM complaints WHERE id = ?", [complaintNumericId]);
    if (!Array.isArray(cRows) || cRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const [result] = await db.execute(
      `INSERT INTO feedback (complaint_id, user_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [complaintNumericId, userId, rating, comment]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result?.insertId,
          complaint_id: complaintNumericId,
          user_id: userId,
          rating,
          comment,
          created_at: new Date().toISOString(),
        },
        message: "Feedback posted",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/complaints/feedback error:", error);
    return NextResponse.json({ success: false, error: "Internal server error", details: error?.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await ensureFeedbackTable();
    const { searchParams } = new URL(req.url);
    const rawRestaurant = searchParams.get("complaint_id");
    if (!rawRestaurant) {
      return NextResponse.json(
        { success: false, error: "Missing required query: complaint_id" },
        { status: 400 }
      );
    }
    const isNumericId = !Number.isNaN(Number(rawRestaurant));
    let complaintNumericId = null;
    if (isNumericId) {
      complaintNumericId = Number(rawRestaurant);
    } else {
      const complaintStr = String(rawRestaurant).trim();
      const [mapRows] = await db.execute("SELECT id FROM complaints WHERE complaint_id = ?", [complaintStr]);
      if (!Array.isArray(mapRows) || mapRows.length === 0) {
        return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
      }
      complaintNumericId = Number(mapRows[0]?.id);
    }

    const [rows] = await db.execute(
      `SELECT id, complaint_id, user_id, rating, comment, created_at
       FROM feedback
       WHERE complaint_id = ?
       ORDER BY created_at DESC`,
      [complaintNumericId]
    );

    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    console.error("GET /api/complaints/feedback error:", error);
    return NextResponse.json({ success: false, error: "Internal server error", details: error?.message }, { status: 500 });
  }
}