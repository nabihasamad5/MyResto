import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

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

export async function POST(req) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "images", "user");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg";
    const filename = `user-${userId}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    await fs.writeFile(filepath, buffer);

    // Public URL
    const publicUrl = `/images/user/${filename}`;

    // Get old avatar to delete
    const [rows] = await db.execute("SELECT avatar FROM users WHERE id = ?", [userId]);
    const oldImage = rows?.[0]?.avatar;

    // Update DB
    await db.execute("UPDATE users SET avatar = ? WHERE id = ?", [publicUrl, userId]);

    // Delete old image if it exists and is not default
    if (oldImage && oldImage.startsWith("/images/user/") && !oldImage.includes("default")) {
      try {
        const oldPath = path.join(process.cwd(), "public", oldImage);
        await fs.unlink(oldPath);
      } catch (e) {
        // Ignore error if file doesn't exist
      }
    }

    return NextResponse.json({ success: true, image: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload avatar", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get current image
    const [rows] = await db.execute("SELECT avatar FROM users WHERE id = ?", [userId]);
    const currentImage = rows?.[0]?.avatar;

    if (currentImage && currentImage.startsWith("/images/user/") && !currentImage.includes("default")) {
      try {
        const filePath = path.join(process.cwd(), "public", currentImage);
        await fs.unlink(filePath);
      } catch (e) {
        // Ignore error if file not found
      }
    }

    // Reset to default or null (depending on your schema, let's say null or specific default)
    // Checking UserMetaCard, it falls back to "/images/user/default.png" if null.
    await db.execute("UPDATE users SET avatar = NULL WHERE id = ?", [userId]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete avatar", details: error?.message }, { status: 500 });
  }
}
