import Link from "next/link";
import { Metadata } from "next";
import { blogPosts } from "@/lib/blogData";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import BuyerHeader from "@/app/components/buyer/layout/BuyerHeader";
import BuyerFooter from "@/app/components/buyer/layout/BuyerFooter";

export const metadata: Metadata = {
  title: "BitForge Blog | Tips for Digital Creators",
  description: "Read the latest articles on how to sell digital products, grow your audience, and maximize your online income in India.",
  alternates: {
    canonical: "https://www.bittforge.in/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-slate-50 flex flex-col">
      {/* We reuse the BuyerHeader for consistent navigation, but pass a dummy search handler or remove it if not needed. */}
      {/* Note: In a real app we might create a generic header, but BuyerHeader works well for the marketplace feel. */}
      
      <main className="flex-grow">
        {/* Blog Header */}
        <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-[#020617] py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              <BookOpen className="w-4 h-4" />
              Creator Resources
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              BitForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Blog</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Everything you need to know about building, marketing, and scaling your digital product business.
            </p>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image Placeholder */}
                <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20" />
                  {/* Real image would go here using next/image */}
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
                      {post.category}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-grow line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}
