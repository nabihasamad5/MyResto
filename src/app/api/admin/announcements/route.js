import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let rows;
    try {
      [rows] = await db.execute(
        `SELECT a.id, a.title, a.message, a.created_by, a.created_at, a.updated_at,
                u.name AS creator_name, u.email AS creator_email, u.avatar AS creator_image
         FROM announcement a
         LEFT JOIN users u ON a.created_by = u.id
         ORDER BY a.created_at DESC`
      );
    } catch (err) {
      [rows] = await db.execute(
        `SELECT a.id, a.title, a.message, a.created_by, a.created_at, a.updated_at,
                u.name AS creator_name, u.email AS creator_email, u.avatar AS creator_image
         FROM announcements a
         LEFT JOIN users u ON a.created_by = u.id
         ORDER BY a.created_at DESC`
      );
    }

    const data = (rows || []).map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      created_by: String(r.created_by ?? ''),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
      creator: {
        image: r.creator_image ?? '',
        name: r.creator_name ?? '',
        email: r.creator_email ?? '',
      },
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}
