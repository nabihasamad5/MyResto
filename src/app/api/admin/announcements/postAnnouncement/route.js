import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { title, message, created_by } = await request.json();

    if (!title || !message || !created_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const creatorIdNum = Number(created_by);
    if (Number.isNaN(creatorIdNum)) {
      return NextResponse.json({ error: 'Invalid created_by: must be a numeric user id' }, { status: 400 });
    }

    let result;
    try {
      [result] = await db.execute(
        'INSERT INTO announcement (title, message, created_by, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [title, message, creatorIdNum]
      );
    } catch (err) {
      [result] = await db.execute(
        'INSERT INTO announcements (title, message, created_by, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [title, message, creatorIdNum]
      );
    }

    // Fetch creator details to include in response
    const [uRows] = await db.execute(
      'SELECT name, email FROM users WHERE id = ?',
      [creatorIdNum]
    );
    const creator = {
      name: uRows?.[0]?.name ?? '',
      email: uRows?.[0]?.email ?? '',
    };

    const response = {
      id: result?.insertId,
      title,
      message,
      created_by: String(creatorIdNum),
      createdAt: new Date().toISOString(),
      creator,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error posting announcement:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}
