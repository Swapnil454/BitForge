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

  const [displayIndices, setDisplayIndices] = useState<number[]>([0, 1, 2, 3]);

  useEffect(() => {
    // On small screens, pick 2 random categories to display
    if (window.innerWidth < 768) {
      const shuffled = [0, 1, 2, 3].sort(() => 0.5 - Math.random());
      setDisplayIndices(shuffled.slice(0, 2));
    }
  }, []);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mb-8 sm:mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {showcaseData.map((data, idx) => (
          <div key={idx} className={displayIndices.includes(idx) ? "block" : "hidden md:block"}>
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
