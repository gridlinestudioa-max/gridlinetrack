import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-white px-4 text-black">
      <div>
        <p className="display text-7xl sm:text-9xl">Red flag</p>
        <p className="mt-4 text-lg text-neutral-600">There&rsquo;s nothing on this part of the track.</p>
        <Link href="/" className="display mt-6 inline-block text-xl text-black underline underline-offset-4">
          Back to the pits →
        </Link>
      </div>
    </main>
  );
}
