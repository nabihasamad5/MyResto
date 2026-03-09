import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch { }
}

export async function GET(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, category_id, name, description, price, is_available, image, prep_time_minutes, popularity FROM menu_items WHERE id = ?",
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch menu item", details: e?.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }

    const form = await req.formData();
    const fields = [];
    const values = [];

    // Helper to add field if present
    const addField = (col, val) => {
      fields.push(`${col} = ?`);
      values.push(val);
    };

    if (form.has("name")) addField("name", String(form.get("name")).trim());
    if (form.has("category_id")) {
      const cid = form.get("category_id");
      addField("category_id", cid ? Number(cid) : null);
    }
    if (form.has("description")) addField("description", String(form.get("description")).trim());
    if (form.has("price")) addField("price", Number(form.get("price") || 0));
    if (form.has("is_available")) addField("is_available", Number(form.get("is_available")));
    if (form.has("prep_time_minutes")) {
      const ptm = form.get("prep_time_minutes");
      addField("prep_time_minutes", ptm ? Number(ptm) : null);
    }
    if (form.has("popularity")) {
      const pop = form.get("popularity");
      addField("popularity", pop ? Number(pop) : null);
    }

    // Handle Image
    const imageFile = form.get("image");
    if (imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
      const uploadDir = path.join(process.cwd(), "public", "images", "menu");
      ensureDir(uploadDir);
      const ext = path.extname(imageFile.name || "");
      const base = path.basename(imageFile.name || "file", ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${Date.now()}_${base}${ext || ""}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.promises.writeFile(filePath, buffer);

      addField("image", `/images/menu/${filename}`);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const [result] = await db.execute(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ success: true, affected: result.affectedRows }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update item", details: e?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const id = Number(params?.id);
  try {
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM menu_items WHERE id = ?", [id]);
    return NextResponse.json({ success: true, deleted: true }, { status: 200 });
  } catch (e) {
    // Check for foreign key constraint violation
    if (e.message && (e.message.includes("foreign key constraint fails") || e.message.includes("Constraint"))) {
      try {
        // Soft delete: mark as unavailable
        await db.execute("UPDATE menu_items SET is_available = 0 WHERE id = ?", [id]);
        return NextResponse.json({
          success: true,
          softDelete: true,
          message: "Item cannot be permanently deleted because it has associated orders history. It has been marked as unavailable instead."
        }, { status: 200 });
      } catch (updateError) {
        return NextResponse.json({ success: false, error: "Failed to soft-delete item", details: updateError?.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to delete item", details: e?.message }, { status: 500 });
  }
}
