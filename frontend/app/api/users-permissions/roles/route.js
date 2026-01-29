import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request) {
  try {
    const result = await pool.query("SELECT id, type FROM app_roles ORDER BY id");
    return NextResponse.json({
      roles: result.rows.map((r) => ({ id: r.id, type: r.type })),
    });
  } catch (err) {
    console.error("Roles error:", err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
