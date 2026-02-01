// utils/api.js (or wherever this file lives)

// Always resolve a valid base URL for both
// Server Components and Client Components
export function getApiBase() {
    // Server-side (Node / Vercel)
    if (typeof window === "undefined") {
      // Vercel production: strip protocol so we never get https://https://...
      if (process.env.NEXT_PUBLIC_APP_URL) {
        const url = process.env.NEXT_PUBLIC_APP_URL.trim().replace(/^https?:\/\//i, "");
        return `https://${url}`;
      }

      // Local development: use 127.0.0.1 so server-side fetch to own API works (localhost can fail with IPv6)
      const port = process.env.PORT || "3000";
      return `http://127.0.0.1:${port}`;
    }

    // Client-side → same-origin
    return "";
  }

  /**
   * Parses nested filter query params like:
   * filters[cuisine][$eq]=Indian
   * filters[author][id][$eq]=123
   */
  export function parseFilters(query) {
    const filters = {};

    for (const [key, value] of Object.entries(query)) {
      const match = key.match(
        /^filters\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?$/
      );

      if (!match) continue;

      const [, a, b, c] = match;

      if (a && b && c) {
        filters[`${a}.${b}.${c}`] = value;
      } else if (a && b) {
        filters[`${a}.${b}`] = value;
      } else if (a) {
        filters[a] = value;
      }
    }

    return filters;
  }

  /**
   * Parses simple filters like:
   * filters[cuisine]=Indian
   * filters[category][$eq]=Dinner
   */
  export function parseFiltersSimple(query) {
    const filters = {};

    for (const [key, value] of Object.entries(query)) {
      const match = key.match(/^filters\[(\w+)\](?:\[\$eq\])?$/);
      if (match) {
        filters[match[1]] = value;
      }
    }

    return filters;
  }

  /**
   * Normalize recipe row from DB / API
   */
  export function toRecipe(row) {
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      cuisine: row.cuisine,
      category: row.category,
      ingredients: row.ingredients,
      instructions: row.instructions,
      imageUrl: row.image_url ?? "",
      isPublic: row.is_public ?? false,
      author: row.author_id,
      prepTime: row.prep_time,
      cookTime: row.cook_time,
      servings: row.servings,
      nutrition: row.nutrition,
      tips: row.tips,
      substitutions: row.substitutions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Normalize pantry item row
   */
  export function toPantryItem(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      imageUrl: row.image_url ?? "",
      owner: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
