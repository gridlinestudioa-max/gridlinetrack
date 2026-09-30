import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-white text-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="display text-sm tracking-[0.3em] text-black">Gridline Track</p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">
          Race night,
          <br />
          handled.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-600">
          A designed website for your short track, plus a race-night engine that turns one event card into your
          event page, flyer, social graphics and email blast.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="display bg-black px-6 py-4 text-xl text-white hover:bg-neutral-800"
          >
            Track admin →
          </Link>
        </div>
      </div>
    </main>
  );
}
