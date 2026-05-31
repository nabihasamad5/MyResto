import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { emitOrderCreated } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const user_id_param = searchParams.get("user_id");
    const authId = getAuthUserId(req);

    // Migration: Ensure created_by exists
    try {
      await db.execute("ALTER TABLE orders ADD COLUMN created_by INT NULL AFTER assigned_to, ADD INDEX (created_by)");
    } catch { }

    const where = [];
    const args = [];
    if (status) {
      where.push("o.status = ?");
      args.push(String(status));
    }
    if (from) {
      where.push("o.created_at >= ?");
      args.push(from);
    }
    if (to) {
      where.push("o.created_at <= ?");
      args.push(to);
    }
    if (user_id_param) {
      const uid = Number(user_id_param);
      if (Number.isFinite(uid)) {
        where.push("o.user_id = ?");
        args.push(uid);
      }
    }
    if (!user_id_param) {
      if (authId) {
        try {
          const [u] = await db.execute("SELECT role FROM users WHERE id = ?", [authId]);
          const role = String(u?.[0]?.role || "").toLowerCase();
          if (role === "customer") {
            where.push("o.user_id = ?");
            args.push(authId);
          } else if (role === "waiter" || role === "delivery") {
            // Staff can see orders they created OR orders assigned to them
            where.push("(o.assigned_to = ? OR o.created_by = ?)");
            args.push(authId, authId);
          }
        } catch { }
      }
    }

    let rows;
    try {
      const sql = `
        SELECT 
          o.id,
          o.order_number,
          o.user_id AS customer_id,
          o.table_id,
          o.delivery_address,
          o.order_type,
          o.total_amount AS total,
          o.tax_amount,
          o.discount_amount,
          o.service_charge,
          o.status,
          o.assigned_to,
          o.created_by,
          o.placed_at,
          o.completed_at,
          o.created_at,
          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY o.id DESC`;
      [rows] = await db.execute(sql, args);
    } catch (err) {
      const sql2 = `
        SELECT 
          id,
          order_number,
          user_id AS customer_id,
          table_id,
          delivery_address,
          order_type,
          total_amount AS total,
          tax_amount,
          discount_amount,
          service_charge,
          status,
          assigned_to,
          created_by,
          placed_at,
          completed_at,
          created_at
        FROM orders
        ${where.length ? "WHERE " + where.map((w) => w.replace(/o\\./g, "")).join(" AND ") : ""}
        ORDER BY id DESC`;
      [rows] = await db.execute(sql2, args);
    }
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const rawType = String(body?.order_type || "").trim().toLowerCase();
    const typeMap = {
      "dinein": "dinein",
      "dine-in": "dinein",
      "takeaway": "takeaway",
      "delivery": "delivery",
      "": "",
    };
    const order_type = typeMap[rawType] || "dinein";
    const table_id = body?.table_id !== undefined ? (body.table_id === null ? null : Number(body.table_id)) : null;
    const total_amount = Number(body?.total_amount || 0);
    const tax_amount = Number(body?.tax_amount || 0);
    const discount_amount = Number(body?.discount_amount || 0);
    const service_charge = Number(body?.service_charge || 0);
    const user_id = body?.user_id !== undefined ? Number(body.user_id) : null;
    const delivery_address = String(body?.delivery_address || "").trim() || null;
    const placed_by = getAuthUserId(req);
    const items = Array.isArray(body?.items) ? body.items : [];

    // Ensure order_items table exists
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          menu_item_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (order_id),
          INDEX (menu_item_id)
        )
      `);
    } catch (e) {
      console.error("Failed to ensure order_items table:", e);
    }

    // order_type always normalized; no need to hard-fail on missing
    if (!Number.isFinite(total_amount) || total_amount <= 0) {
      return NextResponse.json({ success: false, error: "total_amount must be a positive number" }, { status: 400 });
    }

    // Auto-assign to a random delivery person if order type is delivery
    let assigned_to = placed_by;
    if (order_type === "delivery") {
        try {
            const [deliveryStaff] = await db.execute("SELECT id FROM users WHERE role = 'delivery'");
            if (Array.isArray(deliveryStaff) && deliveryStaff.length > 0) {
                const randomIndex = Math.floor(Math.random() * deliveryStaff.length);
                assigned_to = deliveryStaff[randomIndex].id;
            }
        } catch (error) {
            console.error("Failed to auto-assign delivery staff:", error);
        }
    }

    // Migration: Ensure created_by exists
    try {
      await db.execute("ALTER TABLE orders ADD COLUMN created_by INT NULL AFTER assigned_to, ADD INDEX (created_by)");
    } catch { }

    const order_number = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const [result] = await db.execute(
      "INSERT INTO orders (order_number, user_id, table_id, delivery_address, order_type, total_amount, tax_amount, discount_amount, service_charge, status, assigned_to, created_by, placed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [order_number, user_id, table_id, delivery_address, order_type, total_amount, tax_amount, discount_amount, service_charge, "created", assigned_to, placed_by]
    );

    const insertedId = result?.insertId;
    
    // Save items and update popularity
    if (insertedId && items.length > 0) {
      for (const item of items) {
        const mid = Number(item.menu_item_id);
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        if (mid) {
          try {
            await db.execute(
              "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
              [insertedId, mid, qty, price]
            );
            // Increment popularity by quantity ordered
            await db.execute(
              "UPDATE menu_items SET popularity = COALESCE(popularity, 0) + ? WHERE id = ?",
              [qty, mid]
            );
          } catch (e) {
            console.error(`Failed to process order item for menu_item_id ${mid}:`, e);
          }
        }
      }
    }

    if (table_id !== null) {
      try {
        await db.execute("UPDATE dining_tables SET is_active = 0 WHERE id = ?", [table_id]);
      } catch { }
    }
    try {
      emitOrderCreated({
        order: {
          id: insertedId,
          order_number,
          user_id,
          table_id,
          delivery_address,
          order_type,
          total: total_amount,
          tax_amount,
          discount_amount,
          service_charge,
          status: "created",
          assigned_to: assigned_to,
          created_at: new Date().toISOString(),
        },
      });
      // Push notification for the assigned staff or all staff if unassigned
      if (assigned_to) {
        await db.execute(
          "INSERT INTO notifications (user_id, role, title, message, data, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
          [assigned_to, "staff", "New Order Assigned", `Order #${order_number} has been assigned to you.`, JSON.stringify({ order_id: insertedId, order_number })]
        );
      } else {
        // Notify all admins/managers if no one assigned (fallback)
        // Ideally we would select all admins here, but for simplicity let's skip broad broadcast unless requested
      }
    } catch { }
    // Loyalty accrual: 1 point per 100 currency units
    try {
      if (Number.isFinite(total_amount) && user_id) {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS loyalty_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            points_balance INT NOT NULL DEFAULT 0,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        await db.execute(`
          CREATE TABLE IF NOT EXISTS loyalty_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id INT NULL,
            points INT NOT NULL,
            reason VARCHAR(64) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id)
          )
        `);
        const points = Math.max(0, Math.floor(total_amount / 100));
        if (points > 0) {
          await db.execute(
            "INSERT INTO loyalty_transactions (user_id, order_id, points, reason) VALUES (?, ?, ?, ?)",
            [user_id, insertedId, points, "order_placed"]
          );
          const [acctRows] = await db.execute("SELECT points_balance FROM loyalty_accounts WHERE user_id = ?", [user_id]);
          if (Array.isArray(acctRows) && acctRows.length) {
            await db.execute("UPDATE loyalty_accounts SET points_balance = points_balance + ? WHERE user_id = ?", [points, user_id]);
          } else {
            await db.execute("INSERT INTO loyalty_accounts (user_id, points_balance) VALUES (?, ?)", [user_id, points]);
          }
        }
      }
    } catch { }
    return NextResponse.json(
      {
        success: true,
        data: {
          id: insertedId,
          order_number,
          user_id,
          table_id,
          delivery_address,
          order_type,
          total: total_amount,
          tax_amount,
          discount_amount,
          service_charge,
          status: "created",
          assigned_to: assigned_to,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create order", details: error?.message }, { status: 500 });
  }
}
