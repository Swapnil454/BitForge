"use client";

import PromoGridCard from "./PromoGridCard";
import { ProductType } from "../product/ProductCard";

interface PromoGridRowProps {
  products?: ProductType[];
  /** "default" = between Trending & Best Selling; "tools" = between Templates & eBooks */
  variant?: "default" | "tools";
}

export default function PromoGridRow({ products = [], variant = "default" }: PromoGridRowProps) {
  const getProducts = (category: string | null, count: number, seed: number = 0) => {
    let filtered = category
      ? products.filter((p) => p.category === category)
      : products;

    // Deterministic shuffle using seed so SSR & client match
    filtered = [...filtered].sort((a, b) =>
      (parseInt(a._id.slice(-4), 16) + seed) % 97 - (parseInt(b._id.slice(-4), 16) + seed) % 97
    );

    return filtered.slice(0, count);
  };

  const defaultBlocks = [
    { title: "Level up your workflow",   items: getProducts("Software",  4, 1) },
    { title: "Most-loved templates",     items: getProducts("Template",  4, 2) },
    { title: "Expand your knowledge",    items: getProducts("eBook",     4, 3) },
    { title: "Explore top courses",      items: getProducts("Course",    4, 4) },
  ];

  const toolsBlocks = [
    { title: "Design like a pro",        items: getProducts("Design Asset", 4, 5) },
    { title: "Quick-start templates",    items: getProducts("Template",     4, 6) },
    { title: "Must-read guides",         items: getProducts("eBook",        4, 7) },
    { title: "Power your productivity",  items: getProducts("Software",     4, 8) },
  ];

  const blocks = (variant === "tools" ? toolsBlocks : defaultBlocks).filter(block => block.items.length > 0);

  if (blocks.length === 0) return null;

  const lgGridClass = 
    blocks.length === 1 ? "lg:grid-cols-1" :
    blocks.length === 2 ? "lg:grid-cols-2" :
    blocks.length === 3 ? "lg:grid-cols-3" :
    "lg:grid-cols-4";

  return (
    <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 md:px-5 lg:px-6 mb-8 sm:mb-10 mt-2 sm:mt-4">
      <div className={`flex md:grid md:grid-cols-2 ${lgGridClass} gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 hide-scrollbar -mx-3 px-3 md:mx-0 md:px-0`}>
        {blocks.map((block, idx) => (
          <div key={idx} className="w-[85vw] sm:w-[350px] md:w-auto flex-shrink-0 md:flex-shrink md:block snap-center">
            <PromoGridCard title={block.title} items={block.items} />
          </div>
        ))}
      </div>
    </div>
  );
}
