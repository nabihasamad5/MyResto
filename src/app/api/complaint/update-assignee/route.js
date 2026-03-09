import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { emitRestaurantUpdate } from "@/lib/events";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, assigned_to } = body || {};

    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid complaint id" },
        { status: 400 }
      );
    }

    // Authorize only manager/administrator/admin
    const authHeader = request.headers.get("authorization") || "";
    let token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (!token) {
      // Try to read token from cookies when Authorization header is not present
      const cookieHeader = request.headers.get("cookie") || "";
      const cookies = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .reduce((acc, cur) => {
          const [k, v] = cur.split("=");
          if (k) acc[k] = v;
          return acc;
        }, {});
      token = cookies["auth-token"] || cookies["token"] || null;
    }
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let role = "";
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      role = String(decoded?.role || "").toLowerCase();
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (!(role === "manager" || role === "administrator" || role === "admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: insufficient role" },
        { status: 403 }
      );
    }

    // Normalize assigned_to: allow null to unassign; otherwise require a numeric user id
    let assignedToValue = null;
    if (assigned_to !== undefined && assigned_to !== null && String(assigned_to).trim() !== "") {
      const assignedNum = Number(assigned_to);
      if (Number.isNaN(assignedNum)) {
        return NextResponse.json(
          { success: false, error: "Invalid assigned_to value" },
          { status: 400 }
        );
      }
      assignedToValue = assignedNum;
    }

    // If assigning to a user, validate that user exists to avoid FK errors
    if (assignedToValue !== null) {
      const [userRows] = await db.execute("SELECT id FROM users WHERE id = ?", [assignedToValue]);
      if (!Array.isArray(userRows) || userRows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Assigned user not found" },
          { status: 404 }
        );
      }
    }

    const [result] = await db.execute(
      "UPDATE complaints SET assigned_to = ?, updated_at = NOW() WHERE id = ?",
      [assignedToValue, idNum]
    );

    if (result?.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Broadcast assignment change via SSE
    emitRestaurantUpdate({ id: idNum, assigned_to: assignedToValue ?? "", updated_at: new Date().toISOString() });

    return NextResponse.json(
      { success: true, data: { id: idNum, assigned_to: assigned_to ?? "" } },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/complaint/update-assignee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint assignee", details: error?.message },
      { status: 500 }
    );
  }
}