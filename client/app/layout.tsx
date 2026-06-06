import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from 'react-hot-toast';
import AppProviders from "./providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bittforge.in"),
  title: "BitForge | India's Trusted Digital Marketplace",
  description:
    "Buy and sell digital products securely on BitForge. Instant downloads, verified sellers, and secure payments — all in one powerful marketplace.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/apple-icon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning style={{ fontFamily: "'Inter', sans-serif" }}>
      <body
      >
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7177082316952753"
          crossOrigin="anonymous"
        />
        <AppProviders>
          {children}
        </AppProviders>

        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0f172a',
              borderRadius: '100px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.15)',
              maxWidth: '400px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {/*Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BitForge",
              alternateName: "BittForge",
              url: "https://www.bittforge.in",
              logo: "https://www.bittforge.in/logo.png",
              description: "India's trusted digital product marketplace for creators and developers",
              foundingLocation: "India",
              sameAs: [
                "https://www.linkedin.com/company/bittforge",
                "https://instagram.com/bitforge.in",
                "https://github.com/Swapnil454"
              ]
            }),
          }}
        />

        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BitForge",
              url: "https://www.bittforge.in",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.bittforge.in/marketplace?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        {/* Global Autofill Override */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function disableAutofill(el) {
                if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                  if (el.type !== 'password' && el.type !== 'email') {
                    if (el.getAttribute('autocomplete') !== 'nope') el.setAttribute('autocomplete', 'nope');
                    if (el.getAttribute('autocorrect') !== 'off') el.setAttribute('autocorrect', 'off');
                    if (el.getAttribute('spellcheck') !== 'false') el.setAttribute('spellcheck', 'false');
                    if (el.getAttribute('data-lpignore') !== 'true') el.setAttribute('data-lpignore', 'true');
                    if (el.getAttribute('data-form-type') !== 'other') el.setAttribute('data-form-type', 'other');
                  }
                }
              }

              // Process existing elements
              document.addEventListener('DOMContentLoaded', () => {
                document.querySelectorAll('input, textarea').forEach(disableAutofill);
              });

              // Intercept all newly added elements from React instantly
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { 
                      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                        disableAutofill(node);
                      }
                      if (node.querySelectorAll) {
                        node.querySelectorAll('input, textarea').forEach(disableAutofill);
                      }
                    }
                  });
                });
              });

              observer.observe(document.documentElement, {
                childList: true,
                subtree: true
              });

              // Redundant fallback
              document.addEventListener('focusin', function(e) {
                disableAutofill(e.target);
              });
            `
          }}
        />
      </body>
    </html>
  );
}
