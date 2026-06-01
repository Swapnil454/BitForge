import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Best Practices & Compliance | BitForge Docs",
  description: "Learn how BitForge handles security, PCI-compliant payment processing, API key protection, JWT tokens, and GDPR data privacy for your digital marketplace.",
  alternates: {
    canonical: "https://www.bittforge.in/docs/security",
  },
};

export default function SecurityLayout({
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
                name: "Is payment data saved on BitForge servers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. BitForge uses Razorpay for PCI-compliant payment processing. Customer credit card information never touches or is stored on our servers.",
                },
              },
              {
                "@type": "Question",
                name: "How are JWT tokens stored?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Authentication tokens should be stored securely in HTTP-only cookies to prevent XSS attacks, rather than in localStorage.",
                },
              },
              {
                "@type": "Question",
                name: "Is BitForge GDPR compliant?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, we support data minimization, secure data encryption, and provide tools for users to request data exports or account deletion within 30 days.",
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
              { "@type": "ListItem", "position": 3, "name": "Security", "item": "https://www.bittforge.in/docs/security" }
            ]
          }),
        }}
      />
    </>
  );
}
