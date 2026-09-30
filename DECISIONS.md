# Decisions

Format: see DEV_GUIDE.md section 9. Newest first.

## 2026-09-30: Build backend first on a plain black-and-white site
Context: Owner wants the data and admin working before investing in visual design.
Options: A) ship the pit-board template now; B) plain black-and-white until the backend is done.
Chosen: B
Why: Owner's call; keeps focus on the event-card workflow. Bends guardrail 4 ("design is the
product") temporarily. The brand kit is still stored; the site ignores it except for the logo.
Revisit when: Phase 1 backend items are checked off, and before showing anything to a real track.

## 2026-09-30: Hosting on Vercel, with tenant sites under /sites/<slug> for now
Context: `*.vercel.app` doesn't support wildcard subdomains, and there's no custom domain yet.
Options: A) buy a domain now; B) path-based fallback (`ALLOW_PATH_TENANTS=true`).
Chosen: B
Why: Zero cost and no setup; the subdomain routing is already built and works as soon as a
wildcard domain points at Vercel.
Revisit when: a product name and domain are chosen (SPEC section "Working name").

## 2026-09-30: track_members table instead of tracks.owner_id
Context: RLS needs a user-to-track mapping.
Options: A) tracks.owner_id; B) track_members (track_id, user_id, role).
Chosen: B, with only the owner row created and no invite UI.
Why: Same effort; avoids a migration later. Multi-user roles/permissions stay on the Not Now list.
Revisit when: never, unless multi-user leaves the Not Now list.

## 2026-09-30: Admission as a list of label/price lines
Context: SPEC lists `ticket_text` on events.
Chosen: `events.admission` jsonb array of {label, price}, free text prices ("FREE" allowed).
Why: Flyers and graphics need structured lines, not a paragraph.

## 2026-09-30: No image optimisation service
Context: Next's image optimisation on Vercel is metered.
Chosen: plain `<img>` for uploaded images.
Why: Minimal paid services. Revisit if page weight becomes a problem (spec also asks for resized uploads).
