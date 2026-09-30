import type { Metadata } from "next";
import { ROOT_DOMAIN } from "@/lib/env";
import { NewTrackForm } from "./NewTrackForm";

export const metadata: Metadata = { title: "New track — Gridline Track" };

export default function NewTrackPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="display text-4xl sm:text-5xl">New track</h1>
      <p className="mt-2 text-neutral-600">Next you&rsquo;ll set up your logo, colours and fonts.</p>
      <div className="mt-6 border-2 border-neutral-950 bg-white p-5">
        <NewTrackForm rootDomain={ROOT_DOMAIN} />
      </div>
    </main>
  );
}
