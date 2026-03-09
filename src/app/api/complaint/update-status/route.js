import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitRestaurantUpdate } from "@/lib/events";

function normalizeStatus(status) {
  if (!status) return "pending";
  const s = String(status).trim().toLowerCase();
  switch (s) {
    case "pending":
      return "pending";
    case "in process":
    case "in_process":
      return "in_process";
    case "resolved":
      return "resolved";
    case "completed":
      return "completed";
    case "rejected":
      return "rejected";
    default:
      return s.replace(/\s+/g, "_");
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body || {};

    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid complaint id" },
        { status: 400 }
      );
    }

    const normalized = normalizeStatus(status);

    const [result] = await db.execute(
      "UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?",
      [normalized, idNum]
    );

    if (result?.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Emit SSE update for connected clients
    const toTitleCase = (str) =>
      String(str || "")
        .toLowerCase()
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

    const mapStatusDisplay = (s) => {
      const val = String(s || "").toLowerCase();
      switch (val) {
        case "pending":
          return "Pending";
        case "in_process":
        case "in process":
          return "In Process";
        case "resolved":
        case "closed":
          return "Resolved";
        case "completed":
          return "Resolved";
        case "rejected":
          return "Rejected";
        default:
          return toTitleCase(val);
      }
    };

    emitRestaurantUpdate({
      id: idNum,
      status: normalized,
      displayStatus: mapStatusDisplay(normalized),
      updated_at: new Date().toISOString(),
    });

    // Return minimal payload
    return NextResponse.json(
      { success: true, data: { id: idNum, status: normalized } },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/complaint/update-status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint status", details: error?.message },
      { status: 500 }
    );
  }
}