import { Pool } from "pg";

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

export const pool =
  typeof connectionString === "string"
    ? new Pool({
        connectionString,
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
      })
    : new Pool(connectionString);
