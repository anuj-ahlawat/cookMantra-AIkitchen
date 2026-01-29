import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const result = await pool.query("DELETE FROM app_saved_recipes WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error("Saved-recipes DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
