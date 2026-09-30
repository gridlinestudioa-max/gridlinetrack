// Row shapes for the tables in supabase/migrations. Hand-written to avoid a
// codegen dependency; regenerate with `supabase gen types` if you prefer.

export type EventStatus = "draft" | "scheduled" | "postponed" | "rained_out" | "cancelled" | "completed";
export type FontPairId = "oswald-inter" | "bebas-barlow" | "barlowcond-plex" | "anton-sourcesans";
export type TemplateId = "pitboard";

export interface Track {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  timezone: string;
  phone: string | null;
  email: string | null;
  tickets_url: string | null;
  livestream_url: string | null;
  results_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  track_id: string;
  logo_media_id: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_pair: FontPairId;
  template: TemplateId;
}

export interface Media {
  id: string;
  track_id: string;
  bucket: string;
  path: string;
  kind: string;
  alt: string | null;
}

export interface RaceClass {
  id: string;
  track_id: string;
  name: string;
  short_name: string | null;
  description: string | null;
  sort_order: number;
}

export interface AdmissionLine {
  label: string;
  price: string;
}

export interface RaceEvent {
  id: string;
  track_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  event_date: string; // YYYY-MM-DD, local to the track
  gates_open: string | null; // HH:MM:SS
  hot_laps: string | null;
  racing_starts: string | null;
  status: EventStatus;
  rain_date: string | null;
  description: string | null;
  admission: AdmissionLine[];
  tickets_url: string | null;
  livestream_url: string | null;
}

export interface EventClassRow {
  class_id: string;
  purse: string | null;
  is_feature: boolean;
  sort_order: number;
  classes: Pick<RaceClass, "name" | "short_name"> | null;
}

export interface EventSpecialRow {
  id: string;
  title: string;
  details: string | null;
  sort_order: number;
}

export interface EventCard extends RaceEvent {
  event_classes: EventClassRow[];
  event_specials: EventSpecialRow[];
}

export interface SiteData {
  track: Track;
  brand: BrandKit;
  logoUrl: string | null;
  events: EventCard[];
  classes: RaceClass[];
}
