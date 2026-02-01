import { auth, currentUser } from "@clerk/nextjs/server";
import { pool } from "./db.js";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    console.log("No User found");
    return null;
  }

  // Check if user has Pro plan
  const { has } = await auth();
  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";

  try {
    // Find existing user by Clerk ID (no HTTP fetch)
    const existingResult = await pool.query(
      `SELECT id, clerk_id AS "clerkId", username, email, role_id AS "role", subscription_tier AS "subscriptionTier",
       first_name AS "firstName", last_name AS "lastName", image_url AS "imageUrl", confirmed, blocked
       FROM app_users WHERE clerk_id = $1`,
      [user.id]
    );

    if (existingResult.rows.length > 0) {
      const existingUser = { ...existingResult.rows[0], role: existingResult.rows[0].role };

      if (existingUser.subscriptionTier !== subscriptionTier) {
        await pool.query(
          `UPDATE app_users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2`,
          [subscriptionTier, existingUser.id]
        );
      }

      return { ...existingUser, subscriptionTier };
    }

    // New user: get authenticated role from DB
    const rolesResult = await pool.query(
      "SELECT id, type FROM app_roles WHERE type = $1 LIMIT 1",
      ["authenticated"]
    );

    const authenticatedRole = rolesResult.rows[0];
    if (!authenticatedRole) {
      console.error("❌ Authenticated role not found");
      return null;
    }

    const username =
      user.username || user.emailAddresses[0].emailAddress.split("@")[0];
    const email = user.emailAddresses[0].emailAddress;

    const insertResult = await pool.query(
      `INSERT INTO app_users (clerk_id, username, email, password, role_id, first_name, last_name, image_url, subscription_tier, confirmed, blocked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, clerk_id AS "clerkId", username, email, role_id AS "role", subscription_tier AS "subscriptionTier",
       first_name AS "firstName", last_name AS "lastName", image_url AS "imageUrl"`,
      [
        user.id,
        username,
        email,
        `clerk_managed_${user.id}_${Date.now()}`,
        authenticatedRole.id,
        user.firstName || "",
        user.lastName || "",
        user.imageUrl || "",
        subscriptionTier,
        true,
        false,
      ]
    );

    const newUser = insertResult.rows[0];
    newUser.role = newUser.role ?? authenticatedRole.id;
    return newUser;
  } catch (error) {
    console.error("❌ Error in checkUser:", error.message);
    return null;
  }
};
