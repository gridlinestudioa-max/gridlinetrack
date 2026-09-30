import { notFound } from "next/navigation";
import { SitePage, siteMetadata } from "@/components/site/SitePage";
import { getPublicSite, getSiteBase } from "../data";

export async function generateMetadata({ params }: PageProps<"/sites/[slug]/[[...path]]">) {
  const { slug, path } = await params;
  return siteMetadata(await getPublicSite(slug), path);
}

export default async function TenantPage({ params }: PageProps<"/sites/[slug]/[[...path]]">) {
  const { slug, path } = await params;
  const site = await getPublicSite(slug);
  if (!site) notFound();
  return <SitePage site={site} path={path} base={await getSiteBase(slug)} />;
}
