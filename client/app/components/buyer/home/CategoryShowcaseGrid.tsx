"use client";

import { useState, useEffect } from "react";
import CategoryShowcaseCard from "./CategoryShowcaseCard";
import { ProductType } from "../product/ProductCard";

export default function CategoryShowcaseGrid({ products = [] }: { products?: ProductType[] }) {
  // Helper to get up to 4 latest products for a specific category
  const getCategoryItems = (category: string, defaultItems: any[]) => {
    const categoryProducts = products.filter(p => p.category === category);
    
    if (categoryProducts.length > 0) {
      // Return actual products
      return categoryProducts.slice(0, 4).map((p: any) => ({
        title: p.title,
        imageUrl: p.thumbnailUrl || p.fileUrl,
        imageColor: "bg-gray-100 dark:bg-slate-800" // Fallback
      }));
    }
    
    // Return default empty placeholders if no real products
    return defaultItems;
  };

  const showcaseData = [
    {
      title: "Top Courses",
      categoryId: "Course",
      linkText: "Explore courses",
      items: getCategoryItems("Course", [
        { title: "Web Development", imageColor: "bg-blue-100 dark:bg-blue-900/50" },
        { title: "UI/UX Design", imageColor: "bg-purple-100 dark:bg-purple-900/50" },
        { title: "Data Science", imageColor: "bg-emerald-100 dark:bg-emerald-900/50" },
        { title: "Marketing", imageColor: "bg-orange-100 dark:bg-orange-900/50" }
      ])
    },
    {
      title: "Best eBooks",
      categoryId: "eBook",
      linkText: "Explore eBooks",
      items: getCategoryItems("eBook", [
        { title: "Programming", imageColor: "bg-indigo-100 dark:bg-indigo-900/50" },
        { title: "Business", imageColor: "bg-sky-100 dark:bg-sky-900/50" },
        { title: "Design", imageColor: "bg-pink-100 dark:bg-pink-900/50" },
        { title: "Productivity", imageColor: "bg-yellow-100 dark:bg-yellow-900/50" }
      ])
    },
    {
      title: "Templates for You",
      categoryId: "Template",
      linkText: "Explore templates",
      items: getCategoryItems("Template", [
        { title: "Portfolio", imageColor: "bg-cyan-100 dark:bg-cyan-900/50" },
        { title: "Admin Dashboard", imageColor: "bg-slate-200 dark:bg-slate-700/50" },
        { title: "Landing Page", imageColor: "bg-rose-100 dark:bg-rose-900/50" },
        { title: "E-commerce", imageColor: "bg-violet-100 dark:bg-violet-900/50" }
      ])
    },
    {
      title: "Software Tools",
      categoryId: "Software",
      linkText: "Explore software",
      items: getCategoryItems("Software", [
        { title: "Code Tools", imageColor: "bg-zinc-200 dark:bg-zinc-700/50" },
        { title: "Automation", imageColor: "bg-teal-100 dark:bg-teal-900/50" },
        { title: "Productivity", imageColor: "bg-amber-100 dark:bg-amber-900/50" },
        { title: "AI Tools", imageColor: "bg-fuchsia-100 dark:bg-fuchsia-900/50" }
      ])
    }
  ];

  return (
    <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mb-8 sm:mb-12 mt-2 sm:mt-4">
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 hide-scrollbar -mx-3 px-3 md:mx-0 md:px-0">
        {showcaseData.map((data, idx) => (
          <div key={idx} className="w-[85vw] sm:w-[350px] md:w-auto flex-shrink-0 md:flex-shrink md:block snap-center">
            <CategoryShowcaseCard
              title={data.title}
              categoryId={data.categoryId}
              linkText={data.linkText}
              items={data.items}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
