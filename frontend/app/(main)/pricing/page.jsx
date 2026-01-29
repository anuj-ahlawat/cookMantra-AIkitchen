import React from "react";
import { auth } from "@clerk/nextjs/server";
import PricingSection from "@/components/PricingSection";

export default async function PricingPage() {
  const { has } = await auth();
  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <PricingSection subscriptionTier={subscriptionTier} />
    </div>
  );
}
