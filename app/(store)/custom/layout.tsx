export default function CustomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Oswald:wght@400;500;600;700&family=Bebas+Neue&family=Pacifico&family=Lobster&family=Raleway:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&family=Press+Start+2P&family=Permanent+Marker&family=Dancing+Script:wght@400;600;700&family=Abril+Fatface&family=Righteous&family=Orbitron:wght@400;500;600;700&family=Sacramento&family=Satisfy&family=Anton&family=Archivo+Black&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
