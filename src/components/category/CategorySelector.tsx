"use client";

import Link from "next/link";
import { MotorCategoryNode, getChildMotorCategories, getSiblingMotorCategories } from "@/data/motorCategories";
import { CategoryCard } from "./CategoryCard";
import { Sparkles, ArrowRightLeft } from "lucide-react";

interface CategorySelectorProps {
  slugs: string[];
  activeCategory: MotorCategoryNode;
}

export function CategorySelector({ slugs, activeCategory }: CategorySelectorProps) {
  const children = getChildMotorCategories(slugs);
  const siblings = slugs.length > 1 ? getSiblingMotorCategories(slugs) : [];

  // If there are children categories for the current level (e.g. Level 1 -> single-phase/three-phase, Level 2 -> cast-iron/aluminum)
  if (children.length > 0) {
    return (
      <section className="mb-10" aria-labelledby="category-selection-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full" />
            <h2 id="category-selection-heading" className="text-lg sm:text-xl font-bold text-gray-900">
              انتخاب نوع {activeCategory.title}
            </h2>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline-flex items-center gap-1">
            <Sparkles size={13} className="text-blue-600" />
            جهت مشاهده محصولات، نوع مورد نظر را انتخاب کنید
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {children.map((child) => (
            <CategoryCard
              key={child.slug}
              title={child.title}
              href={child.href}
              image={child.image}
              description={child.description}
            />
          ))}
        </div>
      </section>
    );
  }

  // If at leaf level (e.g. cast-iron or aluminum), show sibling switcher for easy exploration
  if (siblings.length > 1) {
    return (
      <div className="mb-8 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-blue-700 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-blue-900">
            تغییر مدل پوسته:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {siblings.map((sibling) => {
            const isCurrent = sibling.slug === activeCategory.slug;
            return (
              <Link
                key={sibling.slug}
                href={sibling.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-blue-700 text-white shadow-sm ring-2 ring-blue-300"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {sibling.title}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
