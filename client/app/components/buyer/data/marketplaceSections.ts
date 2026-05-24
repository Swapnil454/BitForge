export type SectionType = 'Trending' | 'Recommended' | 'Category' | 'NewArrivals';

export type SectionConfig = {
  id: string;
  title: string;
  subtitle?: string;
  type: SectionType;
  categoryFilter?: string;
  limit: number;
};

export const marketplaceSections: SectionConfig[] = [
  {
    id: "trending",
    title: "Trending Digital Products",
    subtitle: "Most-purchased products right now",
    type: "Trending",
    limit: 8,
  },
  {
    id: "recommended",
    title: "Recommended For You",
    subtitle: "Top-rated picks across all categories",
    type: "Recommended",
    limit: 8,
  },
  {
    id: "best-courses",
    title: "Best Selling Courses",
    subtitle: "Level up your skills with highly rated courses",
    type: "Category",
    categoryFilter: "Course",
    limit: 8,
  },
  {
    id: "popular-templates",
    title: "Popular Templates",
    subtitle: "Launch your next project faster",
    type: "Category",
    categoryFilter: "Template",
    limit: 8,
  },
  {
    id: "top-ebooks",
    title: "Top eBooks",
    subtitle: "Expand your knowledge with our best guides",
    type: "Category",
    categoryFilter: "eBook",
    limit: 8,
  },
  {
    id: "new-arrivals",
    title: "New Arrivals",
    subtitle: "The freshest additions to the marketplace",
    type: "NewArrivals",
    limit: 8,
  },
];
