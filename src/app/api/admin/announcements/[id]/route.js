import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(req, { params }) {
    try {
        const id = Number(params?.id);
        if (!Number.isFinite(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        try {
            await db.execute("DELETE FROM announcement WHERE id = ?", [id]);
        } catch (e) {
            await db.execute("DELETE FROM announcements WHERE id = ?", [id]);
            // If both fail, the outer catch will catch it, or it means table doesn't exist etc.
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete announcement", details: error?.message }, { status: 500 });
    }
}
