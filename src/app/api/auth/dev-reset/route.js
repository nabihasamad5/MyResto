import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "Not allowed in production" }, { status: 403 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const [rows] = await db.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    const user = Array.isArray(rows) ? rows[0] : null;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    await db.execute("UPDATE users SET password_hash = ? WHERE email = ?", [hashed, email]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Dev reset error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

