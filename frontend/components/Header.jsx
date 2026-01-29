import React from "react";
import { Button } from "./ui/button";
import { Cookie, Refrigerator, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import HowToCookModal from "./HowToCookModal";
import PricingModal from "./PricingModal";
import Image from "next/image";
import { checkUser } from "@/lib/checkUser";
import { Badge } from "./ui/badge";
import UserDropdown from "./UserDropdown";

export default async function Header() {
  const user = await checkUser();

  return (
    <header className="fixed top-0 w-full border-b border-[var(--border)] bg-[var(--off-white)]/90 backdrop-blur-md z-50 supports-backdrop-filter:bg-[var(--off-white)]/80">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 group"
        >
          <Image
            src="/orange-logo.png"
            alt="CookMantra Logo"
            width={60}
            height={60}
            className="w-16"
          />
        </Link>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[var(--green-muted)]">
          <Link
            href="/recipes"
            className="hover:text-[var(--green)] transition-colors flex gap-1.5 items-center"
          >
            <Cookie className="w-4 h-4" />
            My Recipes
          </Link>
          <Link
            href="/pantry"
            className="hover:text-[var(--green)] transition-colors flex gap-1.5 items-center"
          >
            <Refrigerator className="w-4 h-4" />
            My Pantry
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <HowToCookModal />

          <SignedIn>
            {user && (
              <PricingModal subscriptionTier={user.subscriptionTier}>
                <Badge
                  variant="outline"
                  className={`flex h-8 px-3 gap-1.5 rounded-full text-xs font-semibold transition-all ${
                    user.subscriptionTier === "pro"
                      ? "bg-[var(--green)] text-[var(--off-white)] border-none shadow-sm"
                      : "bg-[var(--beige)] text-[var(--green-dark)] border-[var(--border)] cursor-pointer hover:bg-[var(--beige-warm)]"
                  }`}
                >
                  <Sparkles
                    className={`h-3 w-3 ${
                      user.subscriptionTier === "pro"
                        ? "text-[var(--off-white)] fill-[var(--off-white)]/20"
                        : "text-[var(--green-muted)]"
                    }`}
                  />
                  <span>
                    {user.subscriptionTier === "pro" ? "Pro Chef" : "Free Plan"}
                  </span>
                </Badge>
              </PricingModal>
            )}

            <UserDropdown />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-[var(--green-muted)] hover:text-[var(--green)] hover:bg-[var(--beige-light)] font-medium"
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="primary" className="rounded-full px-6">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
