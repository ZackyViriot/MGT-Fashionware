import './globals.css';
import { CartProvider } from '@/utils/cart-context';
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://mgtfashion.com"),
  title: {
    default: "MGT Fashion",
    template: "%s | MGT Fashion",
  },
  description: "Curated vintage-inspired streetwear and independent fashion",
  openGraph: {
    type: "website",
    siteName: "MGT Fashion",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MGT Fashion",
              url: "https://mgtfashion.com",
              description: "Curated vintage-inspired streetwear and independent fashion",
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@mgtfashion.com",
                contactType: "customer service",
              },
            }),
          }}
        />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
