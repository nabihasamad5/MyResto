import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [tables] = await db.execute(
      `SELECT TABLE_NAME AS table_name
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
       ORDER BY TABLE_NAME`
    );
    const [columns] = await db.execute(
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, DATA_TYPE AS data_type,
              IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default, COLUMN_KEY AS column_key, EXTRA AS extra
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       ORDER BY TABLE_NAME, ORDINAL_POSITION`
    );
    const [fk] = await db.execute(
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, CONSTRAINT_NAME AS constraint_name,
              REFERENCED_TABLE_NAME AS referenced_table, REFERENCED_COLUMN_NAME AS referenced_column
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY TABLE_NAME, COLUMN_NAME`
    );
    const [constraints] = await db.execute(
      `SELECT TABLE_NAME AS table_name, CONSTRAINT_NAME AS constraint_name, CONSTRAINT_TYPE AS constraint_type
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE()
       ORDER BY TABLE_NAME, CONSTRAINT_NAME`
    );
    const data = {
      tables: tables || [],
      columns: columns || [],
      foreign_keys: fk || [],
      constraints: constraints || [],
    };
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch schema", details: error?.message }, { status: 500 });
  }
}

