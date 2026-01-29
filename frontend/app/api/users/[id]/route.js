import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { subscriptionTier } = body;

    const updates = [];
    const values = [];
    let i = 1;
    if (subscriptionTier !== undefined) {
      updates.push(`subscription_tier = $${i++}`);
      values.push(subscriptionTier);
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE app_users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${i} RETURNING id, clerk_id AS "clerkId", username, email, subscription_tier AS "subscriptionTier", first_name AS "firstName", last_name AS "lastName", image_url AS "imageUrl"`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Users PUT error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
