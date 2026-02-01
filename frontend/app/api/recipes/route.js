import { NextResponse } from "next/server";
import { parseFilters, toRecipe } from "@/lib/api-helpers.js";
import { pool } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const filters = parseFilters(query);
    const titleEq = filters["title.$eqi"] || filters.title;

    let result;
    if (titleEq) {
      result = await pool.query(
        `SELECT * FROM app_recipes WHERE LOWER(title) = LOWER($1) ORDER BY id DESC`,
        [titleEq]
      );
    } else {
      result = await pool.query("SELECT * FROM app_recipes ORDER BY id DESC LIMIT 100");
    }

    const data = result.rows.map(toRecipe);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Recipes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const d = body.data || body;
    const {
      title,
      description,
      cuisine,
      category,
      ingredients,
      instructions,
      imageUrl,
      isPublic,
      author,
      prepTime,
      cookTime,
      servings,
      nutrition,
      tips,
      substitutions,
    } = d;

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO app_recipes (title, description, cuisine, category, ingredients, instructions, image_url, is_public, author_id, prep_time, cook_time, servings, nutrition, tips, substitutions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        title,
        description || null,
        cuisine || null,
        category || null,
        JSON.stringify(ingredients || []),
        JSON.stringify(instructions || []),
        imageUrl || "",
        isPublic ?? true,
        author || null,
        prepTime ?? null,
        cookTime ?? null,
        servings ?? null,
        nutrition ? JSON.stringify(nutrition) : null,
        tips ? JSON.stringify(tips) : null,
        substitutions ? JSON.stringify(substitutions) : null,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json({ data: toRecipe(row) }, { status: 201 });
  } catch (err) {
    console.error("Recipes POST error:", err);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
