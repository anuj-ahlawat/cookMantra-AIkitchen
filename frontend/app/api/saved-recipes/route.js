import { NextResponse } from "next/server";
import { parseFilters, toRecipe } from "@/lib/api-helpers.js";
import { pool } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const filters = parseFilters(query);
    const userId = filters["user.id.$eq"] || filters["user.id"];
    const recipeId = filters["recipe.id.$eq"] || filters["recipe.id"];
    const sort = searchParams.get("sort");
    const populate = searchParams.get("populate[recipe][populate]") || searchParams.get("populate");

    if (!userId) {
      return NextResponse.json({ error: "filters[user][id][$eq] required" }, { status: 400 });
    }

    if (recipeId) {
      const result = await pool.query(
        `SELECT sr.id, sr.user_id, sr.recipe_id, sr.saved_at
         FROM app_saved_recipes sr WHERE sr.user_id = $1 AND sr.recipe_id = $2`,
        [userId, recipeId]
      );
      const data = result.rows.map((r) => ({
        id: r.id,
        user: r.user_id,
        recipe: r.recipe_id,
        savedAt: r.saved_at,
      }));
      return NextResponse.json({ data });
    }

    if (populate) {
      const result = await pool.query(
        `SELECT sr.id, sr.user_id, sr.recipe_id, sr.saved_at,
                r.id AS r_id, r.title, r.description, r.cuisine, r.category, r.ingredients, r.instructions,
                r.image_url, r.is_public, r.author_id, r.prep_time, r.cook_time, r.servings,
                r.nutrition, r.tips, r.substitutions, r.created_at, r.updated_at
         FROM app_saved_recipes sr
         JOIN app_recipes r ON r.id = sr.recipe_id
         WHERE sr.user_id = $1
         ORDER BY sr.saved_at DESC`,
        [userId]
      );
      const data = result.rows.map((r) => ({
        id: r.id,
        user: r.user_id,
        savedAt: r.saved_at,
        recipe: toRecipe({
          id: r.r_id,
          title: r.title,
          description: r.description,
          cuisine: r.cuisine,
          category: r.category,
          ingredients: r.ingredients,
          instructions: r.instructions,
          image_url: r.image_url,
          is_public: r.is_public,
          author_id: r.author_id,
          prep_time: r.prep_time,
          cook_time: r.cook_time,
          servings: r.servings,
          nutrition: r.nutrition,
          tips: r.tips,
          substitutions: r.substitutions,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }),
      }));
      return NextResponse.json({ data });
    }

    const result = await pool.query(
      `SELECT id, user_id AS "user", recipe_id AS "recipe", saved_at AS "savedAt" FROM app_saved_recipes WHERE user_id = $1 ${sort === "savedAt:desc" ? "ORDER BY saved_at DESC" : ""}`,
      [userId]
    );
    return NextResponse.json({ data: result.rows });
  } catch (err) {
    console.error("Saved-recipes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch saved recipes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const d = body.data || body;
    const { user: userId, recipe: recipeId, savedAt } = d;

    if (!userId || !recipeId) {
      return NextResponse.json({ error: "user and recipe required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO app_saved_recipes (user_id, recipe_id, saved_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, recipe_id) DO NOTHING
       RETURNING id, user_id AS "user", recipe_id AS "recipe", saved_at AS "savedAt"`,
      [userId, recipeId, savedAt ? new Date(savedAt) : new Date()]
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        'SELECT id, user_id AS "user", recipe_id AS "recipe", saved_at AS "savedAt" FROM app_saved_recipes WHERE user_id = $1 AND recipe_id = $2',
        [userId, recipeId]
      );
      return NextResponse.json({ data: existing.rows[0] }, { status: 201 });
    }

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Saved-recipes POST error:", err);
    return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
  }
}
