import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    let user = null;
    if (session?.user?.email) {
      const email = session.user.email;
      const [rows] = await db.execute(
        "SELECT id, name, email, role, phone, gender, avatar, address FROM users WHERE email = ?",
        [email]
      );
      user = rows?.[0] || null;
    }

    if (!user) {
      const authHeader = req.headers.get('authorization');
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {});
          token = cookies['token'] || cookies['auth-token'];
        }
      }
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const [rows] = await db.execute(
          "SELECT id, name, email, role, phone, gender, avatar, address FROM users WHERE id = ?",
          [userId]
        );
        user = rows?.[0] || null;
      }
    }

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        gender: user.gender || "",
        avatar: user.avatar || "",
        address: user.address || "",
      }
    });
  } catch (error) {
    console.error("Error fetching user data:", error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
