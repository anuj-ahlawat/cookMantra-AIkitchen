export function getApiBase() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function parseFilters(query) {
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    const m = key.match(/^filters\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?$/);
    if (m) {
      const [, a, b, c] = m;
      if (c) filters[`${a}.${b}.${c}`] = value;
      else if (b) filters[`${a}.${b}`] = value;
      else filters[a] = value;
    }
  }
  return filters;
}

export function parseFiltersSimple(query) {
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    const m = key.match(/^filters\[(\w+)\](\[\$eq\])?$/);
    if (m) filters[m[1]] = value;
  }
  return filters;
}

export function toRecipe(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    cuisine: row.cuisine,
    category: row.category,
    ingredients: row.ingredients,
    instructions: row.instructions,
    imageUrl: row.image_url,
    isPublic: row.is_public,
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

export function toPantryItem(row) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    imageUrl: row.image_url || "",
    owner: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
