import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();
        const { name, description, sort_order } = body;

        await db.execute(
            "UPDATE menu_categories SET name = ?, description = ?, sort_order = ? WHERE id = ?",
            [name, description, sort_order, id]
        );

        return NextResponse.json({ success: true, data: { id, name, description, sort_order } }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update category", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = params;

        // Unlink items from this category before deleting
        await db.execute("UPDATE menu_items SET category_id = NULL WHERE category_id = ?", [id]);

        await db.execute("DELETE FROM menu_categories WHERE id = ?", [id]);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete category", details: error?.message }, { status: 500 });
    }
}
