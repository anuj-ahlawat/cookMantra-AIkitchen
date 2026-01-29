import React from "react";
import { Globe, ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getRecipeOfTheDay,
  getCategories,
  getAreas,
} from "@/actions/mealdb.actions";
import { getCategoryEmoji, getCountryFlag } from "@/lib/data";

export default async function DashboardPage() {
  const recipeData = await getRecipeOfTheDay();
  const categoriesData = await getCategories();
  const areasData = await getAreas();

  const recipeOfTheDay = recipeData?.recipe;
  const categories = categoriesData?.categories || [];
  const areas = areasData?.areas || [];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--green-dark)] mb-4 tracking-tight leading-tight">
            Fresh Recipes, Servd Daily 🥬
          </h1>
          <p className="text-xl text-[var(--green-muted)] font-light max-w-2xl">
            Discover thousands of recipes from around the world. Cook, create,
            and savor.
          </p>
        </div>

        {recipeOfTheDay && (
          <section className="mb-24 relative">
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
              <Badge
                variant="outline"
                className="border-2 border-[var(--green)] text-[var(--green)] bg-[var(--beige-light)] font-bold uppercase tracking-wide w-fit shadow-cookmantra"
              >
                <Flame className="mr-1 w-4 h-4" />
                Today&apos;s Special
              </Badge>
            </div>

            <Link
              href={`/recipe?cook=${encodeURIComponent(
                recipeOfTheDay.strMeal
              )}`}
            >
              <div className="relative bg-[var(--off-white)] border border-[var(--border)] overflow-hidden hover:border-[var(--green)]/40 hover:shadow-cookmantra-lg transition-all duration-300 group cursor-pointer rounded-3xl shadow-cookmantra">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-4/3 md:aspect-auto border-b md:border-b-0 md:border-r border-[var(--border)] rounded-tl-3xl md:rounded-l-3xl overflow-hidden">
                    <Image
                      src={recipeOfTheDay.strMealThumb}
                      alt={recipeOfTheDay.strMeal}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge
                        variant="outline"
                        className="border-2 border-[var(--green)] text-[var(--green)] bg-[var(--beige-light)] font-bold"
                      >
                        {recipeOfTheDay.strCategory}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-2 border-[var(--border)] text-[var(--green-muted)] bg-[var(--beige)] font-bold"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        {recipeOfTheDay.strArea}
                      </Badge>
                    </div>

                    <h3 className="text-4xl md:text-5xl font-bold text-[var(--green-dark)] mb-4 group-hover:text-[var(--green)] transition-colors leading-tight">
                      {recipeOfTheDay.strMeal}
                    </h3>

                    <p className="text-[var(--green-muted)] mb-6 line-clamp-3 font-light text-lg">
                      {recipeOfTheDay.strInstructions?.substring(0, 200)}...
                    </p>

                    {recipeOfTheDay.strTags && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {recipeOfTheDay.strTags
                          .split(",")
                          .slice(0, 3)
                          .map((tag, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-[var(--beige)] text-[var(--green-muted)] border border-[var(--border)] font-mono text-xs uppercase"
                            >
                              {tag.trim()}
                            </Badge>
                          ))}
                      </div>
                    )}

                    <Button variant="primary" className="w-fit px-6 py-5">
                      Start Cooking <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        <section className="mb-24">
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--green-dark)] mb-2">
              Browse by Category
            </h2>
            <p className="text-[var(--green-muted)] text-lg font-light">
              Find recipes that match your mood
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((category) => (
              <Link
                key={category.strCategory}
                href={`/recipes/category/${category.strCategory.toLowerCase()}`}
              >
                <div className="bg-[var(--off-white)] p-6 border border-[var(--border)] hover:border-[var(--green)]/40 hover:shadow-cookmantra transition-all text-center group cursor-pointer rounded-2xl">
                  <div className="text-4xl mb-3">
                    {getCategoryEmoji(category.strCategory)}
                  </div>
                  <h3 className="font-bold text-[var(--green-dark)] group-hover:text-[var(--green)] transition-colors text-sm">
                    {category.strCategory}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--green-dark)] mb-2">
              Explore World Cuisines
            </h2>
            <p className="text-[var(--green-muted)] text-lg font-light">
              Travel the globe through food
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {areas.map((area) => (
              <Link
                key={area.strArea}
                href={`/recipes/cuisine/${area.strArea
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <div className="bg-[var(--off-white)] p-5 border border-[var(--border)] hover:border-[var(--green)]/40 hover:shadow-cookmantra transition-all group cursor-pointer rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {getCountryFlag(area.strArea)}
                    </span>
                    <span className="font-bold text-[var(--green-dark)] group-hover:text-[var(--green)] transition-colors text-sm">
                      {area.strArea}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
