import { SitePage, siteMetadata } from "@/components/site/SitePage";
import { getPreviewSite } from "../data";

export async function generateMetadata({ params }: PageProps<"/admin/preview/[trackId]/[[...path]]">) {
  const { trackId, path } = await params;
  const meta = siteMetadata(await getPreviewSite(trackId), path);
  return { ...meta, title: `Preview: ${String(meta.title ?? "")}`, robots: { index: false } };
}

export default async function PreviewPage({ params }: PageProps<"/admin/preview/[trackId]/[[...path]]">) {
  const { trackId, path } = await params;
  const site = await getPreviewSite(trackId);
  if (!site) return null;
  return <SitePage site={site} path={path} base={`/admin/preview/${trackId}`} preview />;
}
