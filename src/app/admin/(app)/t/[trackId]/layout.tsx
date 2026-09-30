import Link from "next/link";
import { requireTrack } from "@/lib/admin";
import { tenantSiteUrl } from "@/lib/env";
import { TrackNav } from "./TrackNav";

export default async function TrackAdminLayout({ children, params }: LayoutProps<"/admin/t/[trackId]">) {
  const { trackId } = await params;
  const { track } = await requireTrack(trackId);
  const base = `/admin/t/${track.id}`;

  return (
    <>
      <div className="border-b-2 border-neutral-950 bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="display min-w-0 truncate text-3xl sm:text-4xl">{track.name}</h1>
            <div className="flex gap-2 text-sm font-semibold">
              <Link href={`/admin/preview/${track.id}`} className="border-2 border-neutral-950 px-3 py-2 hover:bg-neutral-100">
                Preview
              </Link>
              {track.published ? (
                <a
                  href={tenantSiteUrl(track.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-700 px-3 py-2 text-white hover:bg-green-800"
                >
                  Live site ↗
                </a>
              ) : null}
            </div>
          </div>
          <TrackNav base={base} />
        </div>
      </div>
      {!track.published ? (
        <div className="border-b-2 border-neutral-950 bg-[#ffd400]">
          <p className="mx-auto max-w-5xl px-4 py-2 text-sm">
            <strong>Your site isn&rsquo;t live yet.</strong> Use Preview to check it, then publish it in{" "}
            <Link href={`${base}/settings`} className="font-semibold underline">
              Settings
            </Link>
            .
          </p>
        </div>
      ) : null}
      <main className="mx-auto max-w-5xl px-4 py-6 pb-28">{children}</main>
    </>
  );
}
