import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await db.execute("SELECT * FROM menu_categories ORDER BY sort_order ASC, id DESC");
        return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch categories", details: error?.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, description, sort_order } = body;

        const [result] = await db.execute(
            "INSERT INTO menu_categories (name, description, sort_order, created_at) VALUES (?, ?, ?, NOW())",
            [name, description, sort_order || 0]
        );

        return NextResponse.json({ success: true, data: { id: result.insertId, name, description, sort_order } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to create category", details: error?.message }, { status: 500 });
    }
}
