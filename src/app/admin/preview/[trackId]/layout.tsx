import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/SiteShell";
import { requireTrack } from "@/lib/admin";
import { getPreviewSite } from "./data";

export default async function PreviewLayout({ children, params }: LayoutProps<"/admin/preview/[trackId]">) {
  const { trackId } = await params;
  await requireTrack(trackId);
  const site = await getPreviewSite(trackId);
  if (!site) notFound();
  return (
    <SiteShell site={site} base={`/admin/preview/${trackId}`} preview={{ adminHref: `/admin/t/${trackId}` }}>
      {children}
    </SiteShell>
  );
}
