"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["", "Events"],
  ["/classes", "Classes"],
  ["/brand", "Brand"],
  ["/settings", "Settings"],
] as const;

export function TrackNav({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Track" className="-mb-0.5 mt-3 flex overflow-x-auto">
      {TABS.map(([href, label]) => {
        const target = `${base}${href}`;
        const active = href === "" ? pathname === base || pathname.startsWith(`${base}/events`) : pathname.startsWith(target);
        return (
          <Link
            key={label}
            href={target}
            aria-current={active ? "page" : undefined}
            className={`display shrink-0 border-b-4 px-4 py-3 text-lg ${
              active ? "border-[#e10600] text-neutral-950" : "border-transparent text-neutral-500 hover:text-neutral-950"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
