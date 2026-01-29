## Setup

1. Copy `.env.example` to `.env.local` (or `.env`) and set Clerk, PostgreSQL (`DATABASE_*` or `DATABASE_URL`), `GEMINI_API_KEY`, `UNSPLASH_ACCESS_KEY`.
2. Run the DB schema once: open `schema.sql` in Supabase SQL editor and run it, or from project root: `node scripts/init-db.js` (requires `dotenv` and `.env` with `DATABASE_*`).
3. `npm install && npm run dev` — app runs at http://localhost:3000. API routes are at `/api/*` (no API key).

---

### Cuisine

```jsx
italian
chinese
mexican
indian
american
thai
japanese
mediterranean
french
korean
vietnamese
spanish
greek
turkish
moroccan
brazilian
caribbean
middle - eastern
british
german
portuguese
other
```

### Category

```jsx
breakfast
lunch
dinner
snack
dessert
```
