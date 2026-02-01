import { NextResponse } from "next/server";
import { parseFiltersSimple } from "@/lib/api-helpers.js";
import { pool } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const filters = parseFiltersSimple(query);
    const clerkId = filters.clerkId;

    if (!clerkId) {
      return NextResponse.json({ error: "filters[clerkId][$eq] required" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, clerk_id AS "clerkId", username, email, role_id AS "role", subscription_tier AS "subscriptionTier",
       first_name AS "firstName", last_name AS "lastName", image_url AS "imageUrl", confirmed, blocked
       FROM app_users WHERE clerk_id = $1`,
      [clerkId]
    );

    const rows = result.rows.map((r) => ({ ...r, role: r.role }));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Users GET error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      username,
      email,
      password,
      role,
      clerkId,
      firstName,
      lastName,
      imageUrl,
      subscriptionTier,
      confirmed = true,
      blocked = false,
    } = body;

    if (!username || !email || !clerkId) {
      return NextResponse.json({ error: "username, email, clerkId required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO app_users (clerk_id, username, email, password, role_id, first_name, last_name, image_url, subscription_tier, confirmed, blocked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, clerk_id AS "clerkId", username, email, role_id AS "role", subscription_tier AS "subscriptionTier",
       first_name AS "firstName", last_name AS "lastName", image_url AS "imageUrl"`,
      [
        clerkId,
        username,
        email,
        password || null,
        role ?? 2,
        firstName || "",
        lastName || "",
        imageUrl || "",
        subscriptionTier || "free",
        confirmed,
        blocked,
      ]
    );

    const user = result.rows[0];
    user.role = user.role ?? role;
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Users POST error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
