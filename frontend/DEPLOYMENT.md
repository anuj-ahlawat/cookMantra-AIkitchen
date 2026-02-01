# Deploying CookMantra to Vercel

## Fix "User not authenticated" on the deployed site

Auth works on localhost but can fail on Vercel if Clerk and the database are not set up for production.

### 1. Clerk Dashboard (required)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → your application.
2. **Add your production domain:**
   - Open **Configure** → **Domains** (or **Paths**).
   - Add your Vercel URL, e.g. `your-app.vercel.app` (no `https://`).
   - Save.
3. **Use production keys on Vercel:**
   - In Clerk Dashboard go to **API Keys**.
   - Copy the **Production** keys (they start with `pk_live_` and `sk_live_`).
   - Do **not** use development keys (`pk_test_`, `sk_test_`) on Vercel.

### 2. Vercel environment variables

In your Vercel project: **Settings** → **Environment Variables**. Add for **Production** (and Preview if you want):

| Variable | Value | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Production key from Clerk |
| `CLERK_SECRET_KEY` | `sk_live_...` | Production key from Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` | Where to go after sign-in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` | Where to go after sign-up |
| `DATABASE_URL` | `postgresql://...` | Your production PostgreSQL connection string |

**Important:** If `DATABASE_URL` is missing on Vercel, `checkUser()` will fail and you will see "User not authenticated" even when signed in. Set a production PostgreSQL URL (e.g. from Vercel Postgres, Neon, or Supabase).

### 3. Redeploy

After changing env vars, trigger a new deployment (e.g. **Deployments** → **Redeploy**).

### 4. Sign in on the production site

After deploying, open your Vercel URL (e.g. `https://your-app.vercel.app`) and sign in there. The session is tied to that domain; signing in on localhost does not create a session on Vercel.

---

## Summary

- **Clerk:** Production domain added in Dashboard + production keys on Vercel.
- **Database:** `DATABASE_URL` set on Vercel so `checkUser()` can run.
- **Redirects:** After sign-in/sign-up go to `/dashboard`.
- **Session:** Users must sign in on the deployed URL to use the app there.
