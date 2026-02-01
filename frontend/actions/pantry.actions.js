"use server";

import { checkUser } from "@/lib/checkUser";
import { toPantryItem } from "@/lib/api-helpers.js";
import { pool } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Scan image with Gemini Vision
export async function scanPantryImage(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const isPro = user.subscriptionTier === "pro";

    const imageFile = formData.get("image");
    if (!imageFile) {
      return { success: false, error: "No image provided" };
    }

    if (!GEMINI_API_KEY) {
      return { success: false, error: "AI scan not configured. Add GEMINI_API_KEY to .env." };
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are a professional chef and ingredient recognition expert. Analyze this image of a pantry/fridge and identify all visible food ingredients.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {
    "name": "ingredient name",
    "quantity": "estimated quantity with unit",
    "confidence": 0.95
  }
]

Rules:
- Only identify food ingredients (not containers, utensils, or packaging)
- Be specific (e.g., "Cheddar Cheese" not just "Cheese")
- Estimate realistic quantities (e.g., "3 eggs", "1 cup milk", "2 tomatoes")
- Confidence should be 0.7-1.0 (omit items below 0.7)
- Maximum 20 items
- Common pantry staples are acceptable (salt, pepper, oil)
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let ingredients;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      ingredients = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return { success: false, error: "Failed to parse ingredients. Please try again." };
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return {
        success: false,
        error: "No ingredients detected in the image. Please try a clearer photo.",
      };
    }

    return {
      success: true,
      ingredients: ingredients.slice(0, 20),
      scansLimit: isPro ? "unlimited" : 10,
      message: `Found ${ingredients.length} ingredients!`,
    };
  } catch (error) {
    console.error("Error scanning pantry:", error);
    const msg = error?.message || "Failed to scan image";
    if (msg.includes("API key") || msg.includes("GEMINI")) {
      return { success: false, error: "AI scan not configured. Add GEMINI_API_KEY to .env." };
    }
    if (msg.includes("Invalid") || msg.includes("image")) {
      return { success: false, error: "Invalid or unsupported image. Try a JPEG or PNG photo." };
    }
    return { success: false, error: msg };
  }
}

// Save ingredients to pantry
export async function saveToPantry(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const ingredientsJson = formData.get("ingredients");
    const ingredients = JSON.parse(ingredientsJson);

    if (!ingredients || ingredients.length === 0) {
      throw new Error("No ingredients to save");
    }

    const savedItems = [];
    for (const ingredient of ingredients) {
      const name = (ingredient?.name && String(ingredient.name).trim()) || "Unknown";
      const result = await pool.query(
        `INSERT INTO app_pantry_items (name, quantity, image_url, owner_id) VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, ingredient?.quantity || "", "", user.id]
      );
      if (result.rows[0]) {
        savedItems.push(toPantryItem(result.rows[0]));
      }
    }

    return {
      success: true,
      savedItems,
      message: `Saved ${savedItems.length} items to your pantry!`,
    };
  } catch (error) {
    console.error("Error saving to pantry:", error);
    const msg = error?.message || "Failed to save items";
    if (msg.includes("ECONNREFUSED") || msg.includes("connect")) {
      return { success: false, error: "Database not available. Check DATABASE_URL or DB env vars." };
    }
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return { success: false, error: "Database table missing. Run schema.sql to create app_pantry_items." };
    }
    return { success: false, error: msg };
  }
}

// Add pantry item manually — uses DB directly
export async function addPantryItemManually(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const rawName = formData.get("name");
    const rawQuantity = formData.get("quantity");
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const quantity = typeof rawQuantity === "string" ? rawQuantity.trim() : "";

    if (!name) {
      return { success: false, error: "Ingredient name is required" };
    }

    const result = await pool.query(
      `INSERT INTO app_pantry_items (name, quantity, image_url, owner_id) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, quantity || "", "", user.id]
    );

    const row = result.rows[0];
    if (!row) {
      return { success: false, error: "Failed to add item to pantry" };
    }

    const item = toPantryItem(row);
    return {
      success: true,
      item,
      message: "Item added successfully!",
    };
  } catch (error) {
    console.error("Error adding item manually:", error);
    const msg = error?.message || "Failed to add item to pantry";
    if (msg.includes("ECONNREFUSED") || msg.includes("connect")) {
      return { success: false, error: "Database not available. Check DATABASE_URL or DB env vars." };
    }
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return { success: false, error: "Database table missing. Run schema.sql to create app_pantry_items." };
    }
    return { success: false, error: msg };
  }
}

// Get user's pantry items — uses DB directly
export async function getPantryItems() {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const result = await pool.query(
      `SELECT * FROM app_pantry_items WHERE owner_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );

    const items = result.rows.map(toPantryItem);
    const isPro = user.subscriptionTier === "pro";

    return {
      success: true,
      items,
      scansLimit: isPro ? "unlimited" : 10,
    };
  } catch (error) {
    console.error("Error fetching pantry:", error);
    const msg = error?.message || "Failed to load pantry";
    if (msg.includes("ECONNREFUSED") || msg.includes("connect")) {
      return { success: false, error: "Database not available. Check DATABASE_URL or DB env vars." };
    }
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return { success: false, error: "Database table missing. Run schema.sql to create app_pantry_items." };
    }
    return { success: false, error: msg };
  }
}

// Delete pantry item — uses DB directly (ensures user owns item)
export async function deletePantryItem(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const itemId = formData.get("itemId");
    if (!itemId) {
      return { success: false, error: "Item ID is required" };
    }

    const result = await pool.query(
      "DELETE FROM app_pantry_items WHERE id = $1 AND owner_id = $2 RETURNING id",
      [itemId, user.id]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Item not found or not yours" };
    }

    return {
      success: true,
      message: "Item removed from pantry",
    };
  } catch (error) {
    console.error("Error deleting item:", error);
    const msg = error?.message || "Failed to delete item";
    if (msg.includes("ECONNREFUSED") || msg.includes("connect")) {
      return { success: false, error: "Database not available. Check DATABASE_URL or DB env vars." };
    }
    return { success: false, error: msg };
  }
}

// Update pantry item — uses DB directly (ensures user owns item)
export async function updatePantryItem(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const itemId = formData.get("itemId");
    const name = formData.get("name");
    const quantity = formData.get("quantity");

    if (!itemId) {
      return { success: false, error: "Item ID is required" };
    }

    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined && name !== null) {
      updates.push(`name = $${i++}`);
      values.push(name);
    }
    if (quantity !== undefined && quantity !== null) {
      updates.push(`quantity = $${i++}`);
      values.push(quantity);
    }
    if (updates.length === 0) {
      const r = await pool.query("SELECT * FROM app_pantry_items WHERE id = $1 AND owner_id = $2", [itemId, user.id]);
      if (r.rows.length === 0) return { success: false, error: "Item not found" };
      return { success: true, item: toPantryItem(r.rows[0]), message: "Item updated successfully" };
    }

    values.push(itemId, user.id);
    const result = await pool.query(
      `UPDATE app_pantry_items SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${i} AND owner_id = $${i + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Item not found or not yours" };
    }

    return {
      success: true,
      item: toPantryItem(result.rows[0]),
      message: "Item updated successfully",
    };
  } catch (error) {
    console.error("Error updating item:", error);
    const msg = error?.message || "Failed to update item";
    if (msg.includes("ECONNREFUSED") || msg.includes("connect")) {
      return { success: false, error: "Database not available. Check DATABASE_URL or DB env vars." };
    }
    return { success: false, error: msg };
  }
}
