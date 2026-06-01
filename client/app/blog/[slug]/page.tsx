import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, blogPosts } from "@/lib/blogData";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";
import BuyerFooter from "@/app/components/buyer/layout/BuyerFooter";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | BitForge Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://www.bittforge.in/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

// Simple markdown-to-html converter since we don't have react-markdown
function parseMarkdown(md: string) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-5 border-b border-slate-200 dark:border-slate-800 pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 className="text-3xl font-bold mt-10 mb-6">$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote className="border-l-4 border-indigo-500 pl-4 italic my-6 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 py-2 rounded-r-lg">$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p className="mb-6 text-lg text-slate-700 dark:text-slate-300 leading-relaxed">')
    .replace(/^- (.*$)/gim, '<li className="ml-6 mb-2 list-disc text-lg text-slate-700 dark:text-slate-300">$1</li>')
    .replace(/^[0-9]\. (.*$)/gim, '<li className="ml-6 mb-2 list-decimal text-lg text-slate-700 dark:text-slate-300">$1</li>');

  return `<p className="mb-6 text-lg text-slate-700 dark:text-slate-300 leading-relaxed">${html}</p>`;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Generate Article JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": `https://www.bittforge.in${post.image}`,
    "author": {
      "@type": "Organization",
      "name": post.author,
    },
    "publisher": {
      "@type": "Organization",
      "name": "BitForge",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.bittforge.in/logo.png"
      }
    },
    "datePublished": post.date,
    "dateModified": post.date,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] flex flex-col">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-grow pt-8 pb-20">
        <article className="max-w-3xl mx-auto px-4">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-sm font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                {post.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-400 pb-8 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                  B
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-300">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </header>

          <div 
            className="prose prose-lg prose-indigo dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
          />
        </article>
      </main>

      <BuyerFooter />
    </div>
  );
}
