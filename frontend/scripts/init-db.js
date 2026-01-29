/**
 * Run schema.sql once. Usage: node scripts/init-db.js
 * Requires: npm install dotenv (or run from project root with .env present)
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.DATABASE_HOST && {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    database: process.env.DATABASE_NAME || process.env.DATABASE_DATABASE,
    user: process.env.DATABASE_USERNAME || process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

const pool =
  typeof connectionString === "string"
    ? new Pool({
        connectionString,
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
      })
    : new Pool(connectionString);

const schemaPath = path.join(__dirname, "..", "schema.sql");
const sql = fs.readFileSync(schemaPath, "utf8");

async function init() {
  try {
    await pool.query(sql);
    console.log("Schema applied successfully.");
  } catch (err) {
    console.error("Schema error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
