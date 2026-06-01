import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google & GitHub OAuth Setup Guide | BitForge Docs",
  description: "Set up seamless Google and GitHub OAuth authentication for your BitForge marketplace. A complete guide to configuring OAuth apps and redirect URIs.",
  alternates: {
    canonical: "https://www.bittforge.in/docs/oauth-setup",
  },
};

export default function OAuthSetupLayout({
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
                name: "How do I fix the redirect URI mismatch error?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Ensure the Authorized redirect URI in your Google Cloud Console or GitHub OAuth App matches exactly what you configured in your .env file, including the protocol (http/https) and port.",
                },
              },
              {
                "@type": "Question",
                name: "Why is my Google OAuth app unverified?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Google requires manual verification for production applications. During development, you can add test users to bypass this. For production, submit your application for review in the Google Cloud Console.",
                },
              },
              {
                "@type": "Question",
                name: "What happens if a user's email is already registered?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "If a user attempts to log in via OAuth with an email that is already registered with a password, BitForge will prompt them to log in normally and link the accounts from their settings.",
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
              { "@type": "ListItem", "position": 3, "name": "OAuth Setup", "item": "https://www.bittforge.in/docs/oauth-setup" }
            ]
          }),
        }}
      />
    </>
  );
}
