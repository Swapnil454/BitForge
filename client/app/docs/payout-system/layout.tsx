import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Payout System & Earnings | BitForge Docs",
  description: "Learn how the BitForge seller payout system works. Understand platform fees, the 7-day holding period, and how to request bank transfers via RazorpayX.",
  alternates: {
    canonical: "https://www.bittforge.in/docs/payout-system",
  },
};

export default function PayoutSystemLayout({
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
                name: "What is the platform fee on BitForge?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "BitForge charges a flat 10% commission on each digital product sale. Payment gateway fees (approx 2%) are deducted directly by Razorpay before funds arrive.",
                },
              },
              {
                "@type": "Question",
                name: "When do sellers get paid?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can request a payout anytime your available balance exceeds ₹500. We also offer automated weekly payouts every Friday.",
                },
              },
              {
                "@type": "Question",
                name: "How does the 7-day holding period work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "To protect against fraud and handle refunds, all earnings are held in a pending state for exactly 7 days from the time of sale before becoming available for withdrawal.",
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
              { "@type": "ListItem", "position": 3, "name": "Payout System", "item": "https://www.bittforge.in/docs/payout-system" }
            ]
          }),
        }}
      />
    </>
  );
}
