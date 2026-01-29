/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function HowToCookModal() {
  const router = useRouter();
  const [recipeName, setRecipeName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recipeName.trim()) {
      toast.error("Please enter a recipe name");
      return;
    }

    router.push(`/recipe?cook=${encodeURIComponent(recipeName.trim())}`);
    handleOpenChange(false);
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setRecipeName(""); // Reset input when closing
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="hover:text-[var(--green)] transition-colors flex items-center gap-1.5 text-sm font-medium text-[var(--green-muted)]">
          <ChefHat className="w-4 h-4" />
          How to Cook?
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-[var(--off-white)] border-[var(--border)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold flex items-center gap-2 text-[var(--green-dark)]">
            <ChefHat className="w-6 h-6 text-[var(--green)]" />
            How to Cook?
          </DialogTitle>
          <DialogDescription className="text-[var(--green-muted)]">
            Enter any recipe name and our AI chef will guide you through the
            cooking process
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--green-dark)] mb-2">
              What would you like to cook?
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g., Chicken Biryani, Chocolate Cake, Pasta Carbonara"
                className="w-full px-4 py-3 pr-12 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--green)] bg-[var(--beige-light)] text-[var(--green-dark)] placeholder:text-[var(--green-muted)]"
                autoFocus
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--green-muted)]" />
            </div>
          </div>

          <div className="bg-[var(--beige-light)] rounded-xl p-4 border border-[var(--border)]">
            <h4 className="text-sm font-semibold text-[var(--green-dark)] mb-2">
              💡 Try These:
            </h4>
            <div className="flex flex-wrap gap-2">
              {["Butter Chicken", "Chocolate Brownies", "Caesar Salad"].map(
                (example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setRecipeName(example)}
                    className="px-3 py-1 bg-[var(--off-white)] text-[var(--green)] border border-[var(--green)]/40 rounded-full text-sm hover:bg-[var(--beige)] transition-colors"
                  >
                    {example}
                  </button>
                )
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!recipeName.trim()}
            variant="primary"
            className="flex-1 w-full h-12"
          >
            <ChefHat className="w-5 h-5 mr-2" />
            Get Recipe
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
