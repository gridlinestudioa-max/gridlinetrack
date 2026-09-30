import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <p className="display text-8xl text-brand-text">Red flag</p>
      <p className="mt-4 text-lg">We couldn&rsquo;t find that page.</p>
      <Link href="/" className="display mt-6 inline-block text-xl underline underline-offset-4">
        Back to the start →
      </Link>
    </div>
  );
}
