import { Metadata } from "next";

export const metadata: Metadata = {
  title: "BitForge Quick Start Guide | Setup Digital Marketplace",
  description: "Get your BitForge digital product marketplace up and running in 15 minutes. Learn how to set up Next.js, configure MongoDB, and test Razorpay integrations.",
  alternates: {
    canonical: "https://www.bittforge.in/docs/quick-start",
  },
};

export default function QuickStartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How long does it take to set up BitForge?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can get the entire BitForge marketplace running locally in under 15 minutes by cloning the repository, installing dependencies, and configuring your environment variables.",
                },
              },
              {
                "@type": "Question",
                name: "What prerequisites do I need for BitForge?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You need Node.js 18 or higher, MongoDB (local or Atlas), Git, and a Razorpay account for handling payment processing and seller payouts.",
                },
              },
              {
                "@type": "Question",
                name: "Do I need a Razorpay account?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, Razorpay is required as it handles all digital product transactions securely and automates payouts to sellers via RazorpayX.",
                },
              },
            ],
          }),
        }}
      />
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.bittforge.in" },
              { "@type": "ListItem", "position": 2, "name": "Docs", "item": "https://www.bittforge.in/docs" },
              { "@type": "ListItem", "position": 3, "name": "Quick Start", "item": "https://www.bittforge.in/docs/quick-start" }
            ]
          }),
        }}
      />
    </>
  );
}
