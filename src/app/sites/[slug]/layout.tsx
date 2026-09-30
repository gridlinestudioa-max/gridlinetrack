import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/SiteShell";
import { getPublicSite, getSiteBase } from "./data";

export default async function TenantLayout({ children, params }: LayoutProps<"/sites/[slug]">) {
  const { slug } = await params;
  const site = await getPublicSite(slug);
  if (!site) notFound();
  return (
    <SiteShell site={site} base={await getSiteBase(slug)}>
      {children}
    </SiteShell>
  );
}
