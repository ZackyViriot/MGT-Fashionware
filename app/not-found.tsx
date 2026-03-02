import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-heading font-bold text-6xl md:text-8xl text-primary/10 mb-4">404</h1>
      <h2 className="font-heading font-bold text-xl md:text-2xl text-primary mb-2">Page not found</h2>
      <p className="text-muted text-sm mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block bg-dark text-white font-heading font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-dark/80 transition-colors duration-200"
      >
        Back to Home
      </Link>
    </div>
  );
}
