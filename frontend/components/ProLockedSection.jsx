"use client";

import PricingModal from "@/components/PricingModal";
import { Button } from "@/components/ui/button";

export default function ProLockedSection({
  isPro,
  lockText,
  ctaText = "Upgrade to Pro →",
  children,
}) {
  return (
    <div className="relative">
      {/* LOCKED CONTENT */}
      <div className={!isPro ? "blur-sm pointer-events-none" : ""}>
        {children}
      </div>

      {/* OVERLAY */}
      {!isPro && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="bg-[var(--off-white)]/95 border border-[var(--border)] rounded-xl px-4 py-3 text-center shadow-sm">
            <div className="text-sm font-semibold text-[var(--green-dark)]">
              🔒 {lockText}
            </div>
            <PricingModal>
              <Button
                variant="ghost"
                className="text-[var(--green)] hover:text-[var(--green-dark)]"
              >
                {ctaText}
              </Button>
            </PricingModal>
          </div>
        </div>
      )}
    </div>
  );
}
