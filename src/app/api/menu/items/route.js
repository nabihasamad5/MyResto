import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {}
}

export async function GET() {
  try {
    const [rows] = await db.execute(
      "SELECT id, category_id, name, description, price, is_available, image, prep_time_minutes, popularity, created_at, updated_at FROM menu_items ORDER BY id DESC"
    );
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch menu items", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const category_id = form.get("category_id") !== null ? Number(form.get("category_id")) : null;
    const description = String(form.get("description") || "").trim();
    const price = Number(form.get("price") || 0);
    const is_available = form.get("is_available") !== null ? Number(form.get("is_available")) : 1;
    const prep_time_minutes = form.get("prep_time_minutes") !== null ? Number(form.get("prep_time_minutes")) : null;
    const popularity = form.get("popularity") !== null ? Number(form.get("popularity")) : null;
    const imageFile = form.get("image");

    if (!name) {
      return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
    }

    let imagePath = null;
    if (imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
      const uploadDir = path.join(process.cwd(), "public", "images", "menu");
      ensureDir(uploadDir);
      const ext = path.extname(imageFile.name || "");
      const base = path.basename(imageFile.name || "file", ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${Date.now()}_${base}${ext || ""}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.promises.writeFile(filePath, buffer);
      imagePath = `/images/menu/${filename}`;
    }

    const [result] = await db.execute(
      "INSERT INTO menu_items (category_id, name, description, price, is_available, image, prep_time_minutes, popularity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [category_id, name, description, price, is_available, imagePath, prep_time_minutes, popularity]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result?.insertId,
          category_id,
          name,
          description,
          price,
          is_available,
          image: imagePath,
          prep_time_minutes,
          popularity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create menu item", details: error?.message }, { status: 500 });
  }
}
