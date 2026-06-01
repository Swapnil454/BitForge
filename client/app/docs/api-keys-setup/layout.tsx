import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys & Gateway Setup | BitForge Docs",
  description: "Learn how to configure API keys for Razorpay payment gateways, RazorpayX payouts, Google OAuth, and GitHub OAuth for your BitForge marketplace.",
  alternates: {
    canonical: "https://www.bittforge.in/docs/api-keys-setup",
  },
};

export default function ApiKeysSetupLayout({
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
                name: "Where do I find Razorpay test keys?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can find your Razorpay test keys by logging into the Razorpay Dashboard, navigating to Settings -> API Keys, and clicking Generate Test Keys.",
                },
              },
              {
                "@type": "Question",
                name: "Is RazorpayX mandatory for payouts?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, RazorpayX is required to automate bank transfers and payouts to your marketplace sellers. It requires business verification to activate.",
                },
              },
              {
                "@type": "Question",
                name: "How do I secure my OAuth client secrets?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Never commit your Google or GitHub OAuth client secrets to version control. Always store them securely in your server's environment variables (.env file).",
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
              { "@type": "ListItem", "position": 3, "name": "API Keys Setup", "item": "https://www.bittforge.in/docs/api-keys-setup" }
            ]
          }),
        }}
      />
    </>
  );
}
