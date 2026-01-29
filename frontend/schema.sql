-- CookMantra PostgreSQL schema (app_ prefix)
-- Run once: Supabase SQL editor, or: node scripts/init-db.js

CREATE TABLE IF NOT EXISTS app_roles (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO app_roles (type) VALUES ('public'), ('authenticated') ON CONFLICT (type) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  role_id INTEGER NOT NULL DEFAULT 2 REFERENCES app_roles(id),
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  image_url TEXT,
  confirmed BOOLEAN DEFAULT true,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  cuisine VARCHAR(100),
  category VARCHAR(50),
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  author_id INTEGER REFERENCES app_users(id),
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  nutrition JSONB,
  tips JSONB,
  substitutions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_recipes_title ON app_recipes (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_app_recipes_author ON app_recipes (author_id);

CREATE TABLE IF NOT EXISTS app_pantry_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  quantity VARCHAR(255),
  image_url TEXT,
  owner_id INTEGER NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_pantry_owner ON app_pantry_items (owner_id);

CREATE TABLE IF NOT EXISTS app_saved_recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES app_users(id),
  recipe_id INTEGER NOT NULL REFERENCES app_recipes(id),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_app_saved_recipes_user ON app_saved_recipes (user_id);
CREATE INDEX IF NOT EXISTS idx_app_saved_recipes_recipe ON app_saved_recipes (recipe_id);
