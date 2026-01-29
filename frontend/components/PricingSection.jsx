import React from "react";
import { Check } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function PricingSection({ subscriptionTier = "free" }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-4 text-[var(--green-dark)]">Simple Pricing</h2>
        <p className="text-xl text-[var(--green-muted)] font-light">
          Start for free. Upgrade to become a master chef.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border border-[var(--border)] bg-[var(--off-white)] rounded-2xl shadow-cookmantra">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[var(--green-dark)]">FREE</CardTitle>
            <div className="text-5xl font-bold text-[var(--green-dark)]">
              $0
              <span className="text-lg font-normal text-[var(--green-muted)]">/mo</span>
            </div>
            <CardDescription className="text-[var(--green-muted)] font-light text-base">
              Perfect for casual weekly cooks.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="space-y-4">
              {[
                "10 pantry scans per month",
                "5 AI meal recommendations",
                "Standard support",
                "Standard Recipes",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-[var(--green-dark)]">
                  <Check className="h-5 w-5 shrink-0 mt-0.5 text-[var(--green)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className={"mt-auto"}>
            <Link href="/dashboard" className="w-full">
              <Button
                variant="outline"
                className="w-full border-2 border-[var(--green)] hover:bg-[var(--green)] hover:text-[var(--off-white)]"
              >
                Get Started
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="relative border-2 border-[var(--green)] bg-[var(--off-white)] rounded-2xl shadow-cookmantra-lg">
          <Badge className="absolute top-0 right-0 rounded-none rounded-bl-lg bg-[var(--green)] text-[var(--off-white)] font-bold uppercase tracking-wide border-none">
            MOST POPULAR
          </Badge>

          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[var(--green-dark)]">
              PRO
            </CardTitle>
            <div className="text-5xl font-bold text-[var(--green)]">
              $7.99
              <span className="text-lg font-normal text-[var(--green-muted)]">/mo</span>
            </div>
            <CardDescription className="text-[var(--green-muted)] font-light text-base">
              For the serious home cook.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="space-y-4">
              {[
                "Unlimited pantry scans",
                "Unlimited AI recipes",
                "Priority Support",
                "Recipes with Nutritional analysis",
                "Chef's Tips & Tricks",
                "Ingredient Substitutions",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-[var(--green-dark)]">
                  <Badge className="bg-[var(--green)]/20 p-1 rounded-full h-6 w-6 flex items-center justify-center border-none">
                    <Check className="h-4 w-4 text-[var(--green)]" />
                  </Badge>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <SignedIn>
              <CheckoutButton
                planId="cplan_37y5uChZ9uYauQyTlDkXDh997ht"
                planPeriod="month"
                newSubscriptionRedirectUrl="/dashboard"
                checkoutProps={{
                  appearance: {
                    elements: {
                      drawerRoot: {
                        zIndex: 2000,
                      },
                    },
                  },
                }}
              >
                <Button
                  disabled={subscriptionTier === "pro"}
                  variant="primary"
                  className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subscriptionTier === "pro" ? "Subscribed" : "Subscribe Now"}
                </Button>
              </CheckoutButton>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="primary" className="w-full">
                  Login to Subscribe
                </Button>
              </SignInButton>
            </SignedOut>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
