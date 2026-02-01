import { NextResponse } from "next/server";
import { toPantryItem } from "@/lib/api-helpers.js";
import { pool } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const d = body.data || body;
    const { name, quantity } = d;

    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined) {
      updates.push(`name = $${i++}`);
      values.push(name);
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${i++}`);
      values.push(quantity);
    }
    if (updates.length === 0) {
      const r = await pool.query("SELECT * FROM app_pantry_items WHERE id = $1", [id]);
      if (r.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: toPantryItem(r.rows[0]) });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE app_pantry_items SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: toPantryItem(result.rows[0]) });
  } catch (err) {
    console.error("Pantry PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const result = await pool.query("DELETE FROM app_pantry_items WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { id: result.rows[0].id } });
  } catch (err) {
    console.error("Pantry DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
