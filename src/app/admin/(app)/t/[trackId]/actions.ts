"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorMessage, requireTrack, type ActionState } from "@/lib/admin";
import { FONT_PAIRS, HEX_PATTERN, TEMPLATES } from "@/lib/brand";
import { slugify } from "@/lib/tenant";
import type { AdmissionLine, EventStatus } from "@/lib/types";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function optionalUrl(fd: FormData, key: string, errors: Record<string, string>) {
  const value = text(fd, key);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {}
  errors[key] = "Enter a full link starting with https://";
  return null;
}

function refresh(trackId: string) {
  revalidatePath(`/admin/t/${trackId}`, "layout");
}

// ---------------------------------------------------------------------------
// Brand kit
// ---------------------------------------------------------------------------

const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export async function updateBrand(trackId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireTrack(trackId);

  const primary = text(fd, "primary_color");
  const secondary = text(fd, "secondary_color");
  const accent = text(fd, "accent_color");
  const fontPair = text(fd, "font_pair");
  const template = text(fd, "template") || "pitboard";

  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of [["primary_color", primary], ["secondary_color", secondary], ["accent_color", accent]]) {
    if (!HEX_PATTERN.test(value)) fieldErrors[key] = "Use a hex colour like #E10600.";
  }
  if (!FONT_PAIRS.some((p) => p.id === fontPair)) fieldErrors.font_pair = "Pick a font pair.";
  if (!TEMPLATES.some((t) => t.id === template)) fieldErrors.template = "Pick a template.";

  const logo = fd.get("logo");
  const hasLogo = logo instanceof File && logo.size > 0;
  if (hasLogo) {
    if (!LOGO_TYPES[logo.type]) fieldErrors.logo = "Upload a PNG, JPG or WebP image.";
    else if (logo.size > MAX_LOGO_BYTES) fieldErrors.logo = "Logo must be 5 MB or smaller.";
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const { data: current } = await supabase
    .from("brand_kits")
    .select("logo_media_id")
    .eq("track_id", trackId)
    .maybeSingle<{ logo_media_id: string | null }>();

  let logoMediaId = current?.logo_media_id ?? null;
  const removeLogo = fd.get("remove_logo") === "on";

  if (hasLogo) {
    const path = `${trackId}/logo-${crypto.randomUUID()}.${LOGO_TYPES[logo.type]}`;
    const upload = await supabase.storage
      .from("track-media")
      .upload(path, logo, { contentType: logo.type, upsert: false });
    if (upload.error) return { error: "Logo upload failed. Please try again." };

    const { data: media, error } = await supabase
      .from("media")
      .insert({
        track_id: trackId,
        path,
        kind: "logo",
        mime_type: logo.type,
        size_bytes: logo.size,
        alt: "Logo",
        created_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) {
      await supabase.storage.from("track-media").remove([path]);
      return { error: dbErrorMessage(error, "Couldn’t save the logo.") };
    }
    logoMediaId = media.id;
  } else if (removeLogo) {
    logoMediaId = null;
  }

  const { error } = await supabase.from("brand_kits").upsert({
    track_id: trackId,
    primary_color: primary.toUpperCase(),
    secondary_color: secondary.toUpperCase(),
    accent_color: accent.toUpperCase(),
    font_pair: fontPair,
    template,
    logo_media_id: logoMediaId,
  });
  if (error) return { error: dbErrorMessage(error, "Couldn’t save the brand kit.") };

  // Clean up the logo we replaced or removed.
  const oldId = current?.logo_media_id;
  if (oldId && oldId !== logoMediaId) {
    const { data: old } = await supabase.from("media").select("path").eq("id", oldId).maybeSingle<{ path: string }>();
    if (old) await supabase.storage.from("track-media").remove([old.path]);
    await supabase.from("media").delete().eq("id", oldId);
  }

  refresh(trackId);
  return { ok: true, message: "Brand kit saved." };
}

// ---------------------------------------------------------------------------
// Track settings
// ---------------------------------------------------------------------------

export async function updateSettings(trackId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireTrack(trackId);
  const fieldErrors: Record<string, string> = {};

  const name = text(fd, "name");
  if (name.length < 2 || name.length > 120) fieldErrors.name = "Enter the track’s name.";
  const email = text(fd, "email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "Enter a valid email.";
  const timezone = text(fd, "timezone");
  if (!Intl.supportedValuesOf("timeZone").includes(timezone)) fieldErrors.timezone = "Pick a time zone.";
  const tagline = text(fd, "tagline");
  if (tagline.length > 160) fieldErrors.tagline = "Keep it under 160 characters.";

  const update = {
    name,
    tagline: tagline || null,
    city: text(fd, "city") || null,
    region: text(fd, "region") || null,
    address: text(fd, "address") || null,
    timezone,
    phone: text(fd, "phone") || null,
    email: email || null,
    tickets_url: optionalUrl(fd, "tickets_url", fieldErrors),
    livestream_url: optionalUrl(fd, "livestream_url", fieldErrors),
    results_url: optionalUrl(fd, "results_url", fieldErrors),
    facebook_url: optionalUrl(fd, "facebook_url", fieldErrors),
    instagram_url: optionalUrl(fd, "instagram_url", fieldErrors),
    tiktok_url: optionalUrl(fd, "tiktok_url", fieldErrors),
    youtube_url: optionalUrl(fd, "youtube_url", fieldErrors),
    published: fd.get("published") === "on",
  };
  if (Object.keys(fieldErrors).length) return { fieldErrors, error: "Check the highlighted fields." };

  const { error } = await supabase.from("tracks").update(update).eq("id", trackId);
  if (error) return { error: dbErrorMessage(error, "Couldn’t save settings.") };

  refresh(trackId);
  return { ok: true, message: update.published ? "Saved. Your site is live." : "Saved." };
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export async function addClass(trackId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireTrack(trackId);
  const name = text(fd, "name");
  const shortName = text(fd, "short_name").toUpperCase();
  if (!name) return { fieldErrors: { name: "Enter a class name." } };
  if (shortName.length > 16) return { fieldErrors: { short_name: "16 characters max." } };

  const { data: last } = await supabase
    .from("classes")
    .select("sort_order")
    .eq("track_id", trackId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  const { error } = await supabase.from("classes").insert({
    track_id: trackId,
    name,
    short_name: shortName || null,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) {
    return error.code === "23505"
      ? { fieldErrors: { name: "You already have a class with that name." } }
      : { error: dbErrorMessage(error, "Couldn’t add the class.") };
  }
  refresh(trackId);
  return { ok: true, message: `Added ${name}.` };
}

export async function updateClass(trackId: string, classId: string, fd: FormData) {
  const { supabase } = await requireTrack(trackId);
  const name = text(fd, "name");
  if (!name) return;
  await supabase
    .from("classes")
    .update({ name, short_name: text(fd, "short_name").toUpperCase().slice(0, 16) || null })
    .eq("id", classId)
    .eq("track_id", trackId);
  refresh(trackId);
}

export async function moveClass(trackId: string, classId: string, direction: "up" | "down") {
  const { supabase } = await requireTrack(trackId);
  const { data } = await supabase
    .from("classes")
    .select("id, sort_order")
    .eq("track_id", trackId)
    .order("sort_order")
    .order("name")
    .returns<{ id: string; sort_order: number }[]>();
  const list = data ?? [];
  const i = list.findIndex((c) => c.id === classId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(
    list.map((c, index) => supabase.from("classes").update({ sort_order: index }).eq("id", c.id).eq("track_id", trackId)),
  );
  refresh(trackId);
}

export async function deleteClass(trackId: string, classId: string) {
  const { supabase } = await requireTrack(trackId);
  await supabase.from("classes").delete().eq("id", classId).eq("track_id", trackId);
  refresh(trackId);
}

// ---------------------------------------------------------------------------
// Events (the event card)
// ---------------------------------------------------------------------------

const STATUSES: EventStatus[] = ["draft", "scheduled", "postponed", "rained_out", "cancelled", "completed"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}(:\d{2})?$/;

export async function saveEvent(
  trackId: string,
  eventId: string | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const { supabase } = await requireTrack(trackId);
  const fieldErrors: Record<string, string> = {};

  const title = text(fd, "title");
  if (title.length < 2 || title.length > 120) fieldErrors.title = "Give the event a name.";
  const eventDate = text(fd, "event_date");
  if (!DATE.test(eventDate)) fieldErrors.event_date = "Pick a date.";
  const rainDate = text(fd, "rain_date");
  if (rainDate && !DATE.test(rainDate)) fieldErrors.rain_date = "Pick a date.";
  for (const key of ["gates_open", "hot_laps", "racing_starts"]) {
    const v = text(fd, key);
    if (v && !TIME.test(v)) fieldErrors[key] = "Use a time like 7:00 PM.";
  }
  const status = text(fd, "status") as EventStatus;
  if (!STATUSES.includes(status)) fieldErrors.status = "Pick a status.";

  const slug = slugify(text(fd, "slug") || `${title}-${eventDate}`, 80);
  if (!slug) fieldErrors.slug = "Enter a web address for this event.";

  const tickets = optionalUrl(fd, "tickets_url", fieldErrors);
  const livestream = optionalUrl(fd, "livestream_url", fieldErrors);

  // Classes on the card, in the order the form lists them.
  const feature = text(fd, "feature");
  const classes = fd
    .getAll("class_id")
    .map(String)
    .map((classId) => ({
      class_id: classId,
      purse: text(fd, `purse_${classId}`).slice(0, 80),
      is_feature: classId === feature,
    }));

  const specialTitles = fd.getAll("special_title").map((v) => String(v).trim());
  const specialDetails = fd.getAll("special_details").map((v) => String(v).trim());
  const specials = specialTitles
    .map((title, i) => ({ title: title.slice(0, 100), details: (specialDetails[i] ?? "").slice(0, 500) }))
    .filter((s) => s.title);

  const admLabels = fd.getAll("admission_label").map((v) => String(v).trim());
  const admPrices = fd.getAll("admission_price").map((v) => String(v).trim());
  const admission: AdmissionLine[] = admLabels
    .map((label, i) => ({ label: label.slice(0, 60), price: (admPrices[i] ?? "").slice(0, 20) }))
    .filter((a) => a.label && a.price);

  if (Object.keys(fieldErrors).length) return { fieldErrors, error: "Check the highlighted fields." };

  const { data, error } = await supabase.rpc("save_event_card", {
    p_track_id: trackId,
    p_event_id: eventId,
    p_event: {
      slug,
      title,
      subtitle: text(fd, "subtitle"),
      event_date: eventDate,
      gates_open: text(fd, "gates_open"),
      hot_laps: text(fd, "hot_laps"),
      racing_starts: text(fd, "racing_starts"),
      status,
      rain_date: rainDate,
      description: text(fd, "description"),
      admission,
      tickets_url: tickets ?? "",
      livestream_url: livestream ?? "",
    },
    p_classes: classes,
    p_specials: specials,
  });
  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: "Another event already uses this web address." }, error: "Check the highlighted fields." };
    }
    return { error: dbErrorMessage(error, "Couldn’t save the event.") };
  }

  refresh(trackId);
  if (!eventId) redirect(`/admin/t/${trackId}/events/${data as string}?saved=1`);
  return { ok: true, message: "Event card saved." };
}

export async function deleteEvent(trackId: string, eventId: string) {
  const { supabase } = await requireTrack(trackId);
  await supabase.from("events").delete().eq("id", eventId).eq("track_id", trackId);
  refresh(trackId);
  redirect(`/admin/t/${trackId}`);
}
