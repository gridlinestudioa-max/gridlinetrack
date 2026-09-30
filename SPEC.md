# Track Front-End + Race Night Marketing Platform: MVP Spec

Working name: **Gridline Track** (placeholders: PitBoard, Green Flag Sites, RaceDay Studio). Pick one before buying a domain.

## 1. The idea in one paragraph

Small racetracks have weak online front doors (old sites, Facebook pages) and no marketing staff. This product gives a track (a) a well-designed, mobile-first website and (b) a weekly "race night engine": the promoter enters an event once and the system generates the event page, a flyer, social graphics, and an email blast in the track's own brand. Later it adds sponsor inventory tracking and sponsor reports, and fan email/SMS capture so the track owns its audience. It is a front-end and marketing layer that links to whatever the track already uses for tickets, registration, and results. It does not try to replace those systems.

## 2. Positioning (important)

- **Not a competitor to the back office.** MyRacePass and similar platforms handle scoring, registration, and ticketing. Link to them; do not clone them.
- **Do not scrape or copy data from other platforms.** Use outbound links, embeds they explicitly offer, or data the promoter enters. Check any platform's terms before integrating.
- **The wedge is design + weekly marketing effort saved.** Tracks rarely have a designer or marketer. Design quality and "I never have to make a flyer again" are the value.
- **The long-term revenue link is sponsorship.** Sponsor inventory and reporting is what connects the tool to the track's income.

## 3. Customer and buying trigger

- **Buyer:** promoter or owner (often one person doing everything).
- **Best-fit tracks:** new ownership/promoter, recent facility upgrades, growing but with a dated web presence, or a promoter who complains about making flyers every week.
- **Avoid at first:** tracks in decline or with no promoter energy; they won't adopt anything.

## 4. MVP scope: one thin vertical slice

The shared spine is the **event card**. The website, flyer, social graphics, and email are all just outputs of it.

### Must have (v1)

1. **Multi-tenant track accounts.** Each track gets its own site at a subdomain (trackname.yourdomain.com), with custom domain support as a later step.
2. **Brand kit.** Upload logo; system extracts primary and secondary colors; choose a display font pair from a curated set; choose one of 3 to 4 site templates (short track asphalt, dirt oval, road course/karting, plus one neutral). The brand kit drives the site, flyers, and graphics so everything looks like one identity.
3. **Website pages** (template-driven):
   - Home (next event hero, schedule preview, sponsor strip, news)
   - Schedule + event detail pages
   - Classes and rules (simple editable text blocks)
   - Sponsors (logos by tier)
   - Photo gallery
   - Visit info (address, map embed, gates/times, camping/pit info)
   - Contact
4. **Event card.** Date, title, classes running, specials/promotions, gate times, ticket price text, and external ticket/registration/results links. Saving the card publishes the event page.
5. **Flyer generator.** One-click event flyer from the event card in the track's brand kit. Output as PNG and PDF, print-ready and social-sized variants.
6. **Social graphics.** Square and story-size graphics (event announcement, rainout/cancellation notice, results-night "thanks for coming"), generated from the same data.
7. **Email blast.** Simple branded email template sent to subscribers; promoter reviews and sends.
8. **Fan signup.** Email capture form on the site, stored per track, with unsubscribe handling.
9. **Admin dashboard.** Mobile-first. The promoter should be able to create an event and get a flyer on their phone in under 5 minutes.
10. **Billing.** Stripe: setup fee + monthly plan.

### Explicitly not in v1

- Scoring, points, live timing, registration, or ticket sales (link out only)
- Mobile app, SMS (plan for it, but email first), multi-user permissions, custom domain automation, AI-generated copy, sponsor CRM

### v1.5 (fast follows)

- Sponsor inventory and reports: list sponsorable assets (banner ads on site, PA announcements, signage, event naming rights), mark sold/open, renewal dates; one-page sponsor report with site traffic and email reach.
- SMS signup and rainout alerts.
- Custom domains.
- Sponsor-facing "Become a sponsor" page with package tiers and inquiry form.

## 5. Suggested stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind
- **Multi-tenancy:** subdomain routing via middleware; tenant resolved from hostname; row-level security in Postgres keyed by track_id
- **Database, auth, storage:** Supabase
- **Image generation (flyers/graphics):** HTML/CSS templates rendered to images with Satori or @vercel/og (fast, serverless) and Puppeteer for print-quality PDFs if needed
- **Email:** Resend (transactional + broadcast to a track's list)
- **Payments:** Stripe
- **Hosting:** Vercel
- **Analytics:** Plausible or PostHog, tagged per track (needed for sponsor reports later)

## 6. Data model (starting point)

- `tracks` (id, slug, name, plan, owner_id, domain, location, contact info)
- `brand_kits` (track_id, logo_url, colors, font_pair, template_id)
- `classes` (id, track_id, name, notes)
- `events` (id, track_id, date, title, gate_times, ticket_text, ticket_url, registration_url, results_url, status)
- `event_classes` (event_id, class_id)
- `event_specials` (event_id, label, description)
- `media` (id, track_id, url, type, caption)
- `news_posts` (id, track_id, title, body, published_at)
- `sponsors` (id, track_id, name, logo_url, tier, website)
- `subscribers` (id, track_id, email, status, created_at)
- `campaigns` (id, track_id, event_id, type, sent_at, stats)
- v1.5: `sponsor_assets` (id, track_id, name, type, price, status), `sponsor_placements` (asset_id, sponsor_id, start, end)

## 7. Design direction

This is your differentiator. Treat the templates as the product.

- **Broadcast and pit-board feel:** high contrast, condensed display type for dates and numbers, strong grid, generous whitespace.
- Each template should feel designed for its racing type, not like a generic "sports team" theme. Dirt, asphalt, and road course each get their own visual language.
- One brand system across web, flyer, social, and email. The brand kit is the single source of truth.
- Mobile first. Most fans and promoters will see and edit this on phones.
- Flyers must look good printed, not just on screens.
- Your architecture and spatial background is a good angle for venue pages: clean track maps, grandstand and pit area diagrams, a "plan your visit" layout.

## 8. Pricing hypotheses (test, don't trust)

| Item | Hypothesis |
| --- | --- |
| Setup | One-time fee for site build and brand kit; consider reducing for early pilot tracks |
| Monthly plan | Recurring fee covering hosting, race night engine, email sends |
| Sponsor add-on (v1.5) | Extra monthly fee for sponsor inventory and reports |
| Alternative | Lower setup in exchange for a small share of sponsorship revenue the system helps land |

Set real numbers after talking to 5 to 10 promoters. Check what they currently pay (for any website hosting, flyer design, social help) to anchor your price.

## 9. Build plan

- **Phase 0: Validate** (before or alongside building)
  - Pick 3 to 5 target tracks with a clear trigger (see section 3).
  - Build a spec version for ONE real track: a designed home page, a sample flyer generated from their actual schedule, and a sample sponsor report mock. Send it with a short pitch.
  - Goal: one promoter says "I'd use that" and agrees to be the pilot.
- **Phase 1: Foundation** (weeks 1 to 2): Tenant routing, auth, brand kit, schedule + event card, home and schedule pages on one template.
- **Phase 2: Race night engine** (weeks 2 to 4): Flyer and social graphic generation, email blast, fan signup, admin dashboard polish.
- **Phase 3: Templates + pilot** (weeks 4 to 6): Add remaining templates, onboard the pilot track, fix what breaks in real use.
- **Phase 4: Billing + sponsor layer** (weeks 6 to 8): Stripe, sponsor strip and sponsor page, then sponsor inventory and report.

## 10. Success metrics (first 90 days)

- 1 pilot track live and using the event card weekly
- 3 tracks live total
- Promoter creates a flyer in under 5 minutes (measure it)
- At least 1 track pays
- At least 1 sponsor inquiry or renewal attributable to the site or report (this is the proof point)

## 11. Risks and open questions

- **Tracks have little money.** Mitigation: pilot discounts, revenue-share option, target tracks with a trigger.
- **Adoption after launch.** A site nobody updates is useless. The weekly race night engine is meant to create the habit; measure how often promoters return.
- **Service creep.** Tracks will ask for custom work and race-day support. Decide upfront what's included and what's an extra.
- **Dependence on other platforms for data.** Keep integrations link-out only in v1; do not rely on scraping.
- **Seasonality.** Launch in the off-season so tracks are planning their year.
- **Flyer quality at scale.** Auto-generated design can look generic. Invest in a small set of excellent templates rather than lots of options.
- **Email deliverability and consent.** Use double opt-in or clear consent language and honor unsubscribes from day one.

## 12. Claude Code kickoff prompt

(Used to start Phase 1; kept for reference.)

> I'm building a multi-tenant SaaS for small racetracks: a designed website plus a "race night engine" that generates event pages, flyers, social graphics, and email blasts from a single event card. Read SPEC.md first.
>
> Start with Phase 1 only:
> 1. Scaffold Next.js (App Router, TypeScript, Tailwind).
> 2. Set up Supabase (auth + Postgres + storage) with SQL migrations for tracks, brand_kits, classes, events, event_classes, event_specials, media, sponsors, subscribers. Add row-level security keyed by track_id.
> 3. Implement subdomain-based multi-tenancy via middleware (tenant from hostname), with a local dev approach that works on localhost.
> 4. Build the admin: create a track, upload logo, pick colors/font pair/template, create events via an event card form. Mobile-first.
> 5. Build ONE public site template (home, schedule, event detail) that reads the brand kit and uses a broadcast/pit-board visual style: high contrast, condensed display type for dates and numbers, strong grid.
>
> Constraints: minimal dependencies, server components where sensible, SQL migrations as files, README with setup steps. Ask before adding any paid service not listed in the spec. Do not scrape or pull data from any third-party racing platform; external links only. Stop after Phase 1 and summarize what to test.
