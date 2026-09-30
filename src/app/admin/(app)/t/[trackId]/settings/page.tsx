import type { Metadata } from "next";
import { requireTrack } from "@/lib/admin";
import { tenantSiteUrl } from "@/lib/env";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings — Gridline Track" };

export default async function SettingsPage({ params }: PageProps<"/admin/t/[trackId]/settings">) {
  const { trackId } = await params;
  const { track } = await requireTrack(trackId);
  return (
    <div className="grid gap-4">
      <h2 className="display text-3xl">Settings</h2>
      <SettingsForm track={track} siteUrl={tenantSiteUrl(track.slug)} />
    </div>
  );
}
