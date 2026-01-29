import { NextResponse } from "next/server";
import { parseFilters, toPantryItem } from "@/lib/api-helpers";
import { pool } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const filters = parseFilters(query);
    const ownerId = filters["owner.id.$eq"] || filters["owner.id"];

    if (!ownerId) {
      return NextResponse.json({ error: "filters[owner][id][$eq] required" }, { status: 400 });
    }

    const order = searchParams.get("sort") === "createdAt:desc" ? "ORDER BY created_at DESC" : "";
    const result = await pool.query(
      `SELECT * FROM app_pantry_items WHERE owner_id = $1 ${order}`,
      [ownerId]
    );

    const data = result.rows.map(toPantryItem);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Pantry GET error:", err);
    return NextResponse.json({ error: "Failed to fetch pantry items" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const d = body.data || body;
    const { name, quantity, imageUrl, owner } = d;

    if (!name || owner === undefined) {
      return NextResponse.json({ error: "name and owner required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO app_pantry_items (name, quantity, image_url, owner_id) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, quantity || "", imageUrl || "", owner]
    );

    return NextResponse.json({ data: toPantryItem(result.rows[0]) }, { status: 201 });
  } catch (err) {
    console.error("Pantry POST error:", err);
    return NextResponse.json({ error: "Failed to add pantry item" }, { status: 500 });
  }
}
