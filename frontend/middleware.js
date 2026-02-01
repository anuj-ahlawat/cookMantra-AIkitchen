import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/recipe(.*)",
  "/recipes(.*)",
  "/pantry(.*)",
  "/dashboard(.*)",
]);

// Dynamic domain + authorizedParties so Clerk session works on production (Vercel) and localhost
export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  (req) => {
    const origin = req.nextUrl.origin;
    return {
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      domain: req.nextUrl.host,
      // Allow this origin so Server Actions receive the session (fixes "User not authenticated" on Vercel)
      authorizedParties: [origin],
    };
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
