import './globals.css';
import { CartProvider } from '@/utils/cart-context';

export const metadata = {
  title: 'MGT Fashion',
  description: 'Curated vintage-inspired streetwear and independent fashion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Oswald:wght@400;500;600;700&family=Bebas+Neue&family=Pacifico&family=Lobster&family=Raleway:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&family=Press+Start+2P&family=Permanent+Marker&family=Dancing+Script:wght@400;600;700&family=Abril+Fatface&family=Righteous&family=Orbitron:wght@400;500;600;700&family=Sacramento&family=Satisfy&family=Anton&family=Archivo+Black&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
