import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b0b0c] px-4 text-white">
      <div>
        <div className="stripe mb-6 h-2" />
        <p className="display text-7xl sm:text-9xl">Red flag</p>
        <p className="mt-4 text-lg text-white/75">There&rsquo;s nothing on this part of the track.</p>
        <Link href="/" className="display mt-6 inline-block text-xl text-[#ffd400] underline underline-offset-4">
          Back to the pits →
        </Link>
      </div>
    </main>
  );
}
