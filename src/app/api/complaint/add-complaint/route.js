import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      student_id,
      title,
      category,
      priority,
      description,
      status = "pending",
      image = null,
      created_by,
      assigned_to = null,
    } = body;

    // Generate complaint_id (unique-ish) and set created_by to the student
    const complaint_id = `CMP-${Date.now()}`;
    const normalizedStatus = (status || "pending").toLowerCase();

    // Validate basic required fields
    if (!title || !category || !description) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, description" },
        { status: 400 }
      );
    }

    // Determine creator id: prefer provided created_by, else student_id
    const creatorSource = created_by ?? student_id;
    const createdByNum = Number(creatorSource);
    const studentIdNum = Number(student_id);
    if (Number.isNaN(createdByNum)) {
      return NextResponse.json(
        { error: "Invalid created_by/student_id: must be a numeric user id" },
        { status: 400 }
      );
    }

    // Verify the user exists to satisfy FK constraint
    const [userRows] = await db.execute("SELECT id FROM users WHERE id = ?", [createdByNum]);
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return NextResponse.json(
        { error: "User not found for provided created_by/student_id" },
        { status: 400 }
      );
    }

    // Perform insert (omit auto-increment id; set timestamps in DB)
    const [result] = await db.execute(
      `INSERT INTO complaints (complaint_id, title, category, priority, description, status, image, created_by, assigned_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        complaint_id,
        title,
        category,
        priority,
        description,
        normalizedStatus,
        image,
        createdByNum,
        assigned_to,
      ]
    );

    return NextResponse.json(
      { message: "Restaurant added successfully", complaint_id, insertId: result?.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding complaint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
