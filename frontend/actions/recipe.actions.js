"use server";

import { checkUser } from "@/lib/checkUser";
import { toRecipe } from "@/lib/api-helpers.js";
import { pool } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper function to normalize recipe title
function normalizeTitle(title) {
  return title
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Helper function to fetch image from Unsplash
async function fetchRecipeImage(recipeName) {
  try {
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn("⚠️ UNSPLASH_ACCESS_KEY not set, skipping image fetch");
      return "";
    }

    const searchQuery = `${recipeName}`;
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchQuery
      )}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error("❌ Unsplash API error:", response.statusText);
      return "";
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      console.log("✅ Found Unsplash image:", photo.urls.regular);
      return photo.urls.regular;
    }

    console.log("ℹ️ No Unsplash image found for:", recipeName);
    return "";
  } catch (error) {
    console.error("❌ Error fetching Unsplash image:", error);
    return "";
  }
}

// Get or generate recipe details
export async function getOrGenerateRecipe(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const recipeName = formData.get("recipeName");
    if (!recipeName) {
      return { success: false, error: "Recipe name is required" };
    }

    // Normalize the title (e.g., "apple cake" → "Apple Cake")
    const normalizedTitle = normalizeTitle(recipeName);
    console.log("🔍 Searching for recipe:", normalizedTitle);

    const isPro = user.subscriptionTier === "pro";

    // Step 1: Check if recipe already exists in DB (direct query, no fetch)
    const searchResult = await pool.query(
      `SELECT * FROM app_recipes WHERE LOWER(title) = LOWER($1) ORDER BY id DESC LIMIT 1`,
      [normalizedTitle]
    );

    if (searchResult.rows.length > 0) {
      const row = searchResult.rows[0];
      const recipeData = toRecipe(row);
      console.log("✅ Recipe found in database:", recipeData.id);

      // Check if user has saved this recipe
      const savedResult = await pool.query(
        `SELECT id FROM app_saved_recipes WHERE user_id = $1 AND recipe_id = $2 LIMIT 1`,
        [user.id, recipeData.id]
      );
      const isSaved = savedResult.rows.length > 0;

      return {
        success: true,
        recipe: recipeData,
        recipeId: recipeData.id,
        isSaved,
        fromDatabase: true,
        isPro,
        message: "Recipe loaded from database",
      };
    }

    // Step 2: Recipe doesn't exist, generate with Gemini
    console.log("🤖 Recipe not found, generating with Gemini...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are a professional chef and recipe expert. Generate a detailed recipe for: "${normalizedTitle}"

CRITICAL: The "title" field MUST be EXACTLY: "${normalizedTitle}" (no changes, no additions like "Classic" or "Easy")

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "title": "${normalizedTitle}",
  "description": "Brief 2-3 sentence description of the dish",
  "category": "Must be ONE of these EXACT values: breakfast, lunch, dinner, snack, dessert",
  "cuisine": "Must be ONE of these EXACT values: italian, chinese, mexican, indian, american, thai, japanese, mediterranean, french, korean, vietnamese, spanish, greek, turkish, moroccan, brazilian, caribbean, middle-eastern, british, german, portuguese, other",
  "prepTime": "Time in minutes (number only)",
  "cookTime": "Time in minutes (number only)",
  "servings": "Number of servings (number only)",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity with unit",
      "category": "Protein|Vegetable|Spice|Dairy|Grain|Other"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "title": "Brief step title",
      "instruction": "Detailed step instruction",
      "tip": "Optional cooking tip for this step"
    }
  ],
  "nutrition": {
    "calories": "calories per serving",
    "protein": "grams",
    "carbs": "grams",
    "fat": "grams"
  },
  "tips": [
    "General cooking tip 1",
    "General cooking tip 2",
    "General cooking tip 3"
  ],
  "substitutions": [
    {
      "original": "ingredient name",
      "alternatives": ["substitute 1", "substitute 2"]
    }
  ]
}

IMPORTANT RULES FOR CATEGORY:
- Breakfast items (pancakes, eggs, cereal, etc.) → "breakfast"
- Main meals for midday (sandwiches, salads, pasta, etc.) → "lunch"
- Main meals for evening (heavier dishes, roasts, etc.) → "dinner"
- Light items between meals (chips, crackers, fruit, etc.) → "snack"
- Sweet treats (cakes, cookies, ice cream, etc.) → "dessert"

IMPORTANT RULES FOR CUISINE:
- Use lowercase only
- Pick the closest match from the allowed values
- If uncertain, use "other"

Guidelines:
- Make ingredients realistic and commonly available
- Instructions should be clear and beginner-friendly
- Include 6-10 detailed steps
- Provide practical cooking tips
- Estimate realistic cooking times
- Keep total instructions under 12 steps
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let recipeData;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      recipeData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to generate recipe. Please try again.");
    }

    // FORCE the title to be our normalized version
    recipeData.title = normalizedTitle;

    // Validate and sanitize category
    const validCategories = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "dessert",
    ];
    const category = validCategories.includes(
      recipeData.category?.toLowerCase()
    )
      ? recipeData.category.toLowerCase()
      : "dinner";

    // Validate and sanitize cuisine
    const validCuisines = [
      "italian",
      "chinese",
      "mexican",
      "indian",
      "american",
      "thai",
      "japanese",
      "mediterranean",
      "french",
      "korean",
      "vietnamese",
      "spanish",
      "greek",
      "turkish",
      "moroccan",
      "brazilian",
      "caribbean",
      "middle-eastern",
      "british",
      "german",
      "portuguese",
      "other",
    ];
    const cuisine = validCuisines.includes(recipeData.cuisine?.toLowerCase())
      ? recipeData.cuisine.toLowerCase()
      : "other";

    // Step 3: Fetch image from Unsplash
    console.log("🖼️ Fetching image from Unsplash...");
    const imageUrl = await fetchRecipeImage(normalizedTitle);

    // Step 4: Save generated recipe to database
    const recipePayload = {
      data: {
        title: normalizedTitle,
        description: recipeData.description,
        cuisine,
        category,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: Number(recipeData.prepTime),
        cookTime: Number(recipeData.cookTime),
        servings: Number(recipeData.servings),
        nutrition: recipeData.nutrition,
        tips: recipeData.tips,
        substitutions: recipeData.substitutions,
        imageUrl: imageUrl || "",
        isPublic: true,
        author: user.id,
      },
    };

    console.log(
      "📤 Saving new recipe to database with title:",
      normalizedTitle
    );

    const insertResult = await pool.query(
      `INSERT INTO app_recipes (title, description, cuisine, category, ingredients, instructions, image_url, is_public, author_id, prep_time, cook_time, servings, nutrition, tips, substitutions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        normalizedTitle,
        recipePayload.data.description || null,
        recipePayload.data.cuisine || null,
        recipePayload.data.category || null,
        JSON.stringify(recipePayload.data.ingredients || []),
        JSON.stringify(recipePayload.data.instructions || []),
        recipePayload.data.imageUrl || "",
        recipePayload.data.isPublic ?? true,
        recipePayload.data.author || null,
        recipePayload.data.prepTime ?? null,
        recipePayload.data.cookTime ?? null,
        recipePayload.data.servings ?? null,
        recipePayload.data.nutrition ? JSON.stringify(recipePayload.data.nutrition) : null,
        recipePayload.data.tips ? JSON.stringify(recipePayload.data.tips) : null,
        recipePayload.data.substitutions ? JSON.stringify(recipePayload.data.substitutions) : null,
      ]
    );

    const createdRow = insertResult.rows[0];
    const createdRecipeData = toRecipe(createdRow);
    console.log("✅ Recipe saved to database:", createdRecipeData.id);

    return {
      success: true,
      recipe: {
        ...recipeData,
        title: normalizedTitle,
        category,
        cuisine,
        imageUrl: imageUrl || "",
      },
      recipeId: createdRecipeData.id,
      isSaved: false,
      fromDatabase: false,
      recommendationsLimit: isPro ? "unlimited" : 5,
      isPro,
      message: "Recipe generated and saved successfully!",
    };
  } catch (error) {
    console.error("❌ Error in getOrGenerateRecipe:", error);
    return {
      success: false,
      error: error.message || "Failed to load recipe",
    };
  }
}

// Save recipe to user's collection (bookmark) — uses DB directly for localhost + Vercel
export async function saveRecipeToCollection(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const recipeId = formData.get("recipeId");
    if (!recipeId) {
      return { success: false, error: "Recipe ID is required" };
    }

    const recipeIdNum = parseInt(recipeId, 10);
    if (isNaN(recipeIdNum)) {
      return { success: false, error: "Invalid recipe ID" };
    }

    // Check if already saved (direct DB)
    const existing = await pool.query(
      `SELECT id FROM app_saved_recipes WHERE user_id = $1 AND recipe_id = $2 LIMIT 1`,
      [user.id, recipeIdNum]
    );

    if (existing.rows.length > 0) {
      return {
        success: true,
        alreadySaved: true,
        message: "Recipe is already in your collection",
      };
    }

    // Insert saved recipe (direct DB)
    const insertResult = await pool.query(
      `INSERT INTO app_saved_recipes (user_id, recipe_id, saved_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, recipe_id) DO NOTHING
       RETURNING id, user_id AS "user", recipe_id AS "recipe", saved_at AS "savedAt"`,
      [user.id, recipeIdNum, new Date()]
    );

    if (insertResult.rows.length === 0) {
      return {
        success: true,
        alreadySaved: true,
        message: "Recipe is already in your collection",
      };
    }

    const savedRecipe = insertResult.rows[0];
    console.log("✅ Recipe saved to user collection:", savedRecipe.id);

    return {
      success: true,
      alreadySaved: false,
      savedRecipe,
      message: "Recipe saved to your collection!",
    };
  } catch (error) {
    console.error("❌ Error saving recipe to collection:", error);
    return { success: false, error: error.message || "Failed to save recipe to collection" };
  }
}

// Remove recipe from user's collection (unbookmark) — uses DB directly
export async function removeRecipeFromCollection(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const recipeId = formData.get("recipeId");
    if (!recipeId) {
      return { success: false, error: "Recipe ID is required" };
    }

    const recipeIdNum = parseInt(recipeId, 10);
    if (isNaN(recipeIdNum)) {
      return { success: false, error: "Invalid recipe ID" };
    }

    const searchResult = await pool.query(
      `SELECT id FROM app_saved_recipes WHERE user_id = $1 AND recipe_id = $2 LIMIT 1`,
      [user.id, recipeIdNum]
    );

    if (searchResult.rows.length === 0) {
      return {
        success: true,
        message: "Recipe was not in your collection",
      };
    }

    await pool.query("DELETE FROM app_saved_recipes WHERE id = $1", [
      searchResult.rows[0].id,
    ]);
    console.log("✅ Recipe removed from user collection");

    return {
      success: true,
      message: "Recipe removed from your collection",
    };
  } catch (error) {
    console.error("❌ Error removing recipe from collection:", error);
    return { success: false, error: error.message || "Failed to remove recipe" };
  }
}

// Get recipes based on pantry ingredients — uses DB directly
export async function getRecipesByPantryIngredients() {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const isPro = user.subscriptionTier === "pro";

    const pantryResult = await pool.query(
      `SELECT * FROM app_pantry_items WHERE owner_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );

    if (!pantryResult.rows.length) {
      return {
        success: false,
        message: "Your pantry is empty. Add ingredients first!",
      };
    }

    const ingredients = pantryResult.rows.map((r) => r.name).join(", ");

    console.log("🥘 Finding recipes for ingredients:", ingredients);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are a professional chef. Given these available ingredients: ${ingredients}

Suggest 5 recipes that can be made primarily with these ingredients. It's okay if the recipes need 1-2 common pantry staples (salt, pepper, oil, etc.) that aren't listed.

Return ONLY a valid JSON array (no markdown, no explanations):
[
  {
    "title": "Recipe name",
    "description": "Brief 1-2 sentence description",
    "matchPercentage": 85,
    "missingIngredients": ["ingredient1", "ingredient2"],
    "category": "breakfast|lunch|dinner|snack|dessert",
    "cuisine": "italian|chinese|mexican|etc",
    "prepTime": 20,
    "cookTime": 30,
    "servings": 4
  }
]

Rules:
- matchPercentage should be 70-100% (how many listed ingredients are used)
- missingIngredients should be common items or optional additions
- Sort by matchPercentage descending
- Make recipes realistic and delicious
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let recipeSuggestions;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      recipeSuggestions = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error(
        "Failed to generate recipe suggestions. Please try again."
      );
    }

    return {
      success: true,
      recipes: recipeSuggestions,
      ingredientsUsed: ingredients,
      recommendationsLimit: isPro ? "unlimited" : 5,
      message: `Found ${recipeSuggestions.length} recipes you can make!`,
    };
  } catch (error) {
    console.error("❌ Error in getRecipesByPantryIngredients:", error);
    return { success: false, error: error.message || "Failed to get recipe suggestions" };
  }
}

// Get user's saved recipes — uses DB directly
export async function getSavedRecipes() {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const result = await pool.query(
      `SELECT sr.id, sr.saved_at,
              r.id AS r_id, r.title, r.description, r.cuisine, r.category, r.ingredients, r.instructions,
              r.image_url, r.is_public, r.author_id, r.prep_time, r.cook_time, r.servings,
              r.nutrition, r.tips, r.substitutions, r.created_at, r.updated_at
       FROM app_saved_recipes sr
       JOIN app_recipes r ON r.id = sr.recipe_id
       WHERE sr.user_id = $1
       ORDER BY sr.saved_at DESC`,
      [user.id]
    );

    const recipes = result.rows.map((r) =>
      toRecipe({
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
      })
    );

    return {
      success: true,
      recipes,
      count: recipes.length,
    };
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    return { success: false, error: error.message || "Failed to load saved recipes" };
  }
}
