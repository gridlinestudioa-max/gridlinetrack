# Project context
Multi-tenant SaaS for small racetracks: designed website + race night engine
(event card -> page, flyer, social graphics, email).

# Read first
SPEC.md (what to build), DEV_GUIDE.md (how to stay on track), WORKLOG.md
(current state), DECISIONS.md (why things are the way they are).

# Rules
- The event card is the single source of data for all outputs.
- External links only for tickets/registration/results. Do not scrape third-party platforms.
- Mobile-first UI. Design quality matters: high contrast, condensed display type
  for numbers, strong grid. (Currently deliberately plain black-and-white; see DECISIONS.md.)
- Minimal dependencies. Ask before adding any dependency or paid service.
- SQL migrations as files. RLS on every tenant table, keyed by track_id.
- Tests required for tenant isolation, billing, and email unsubscribe.
- Work on one checklist item at a time. Stop and summarize when done.
- Do not build anything on the Not Now list in DEV_GUIDE.md.

# Environment
- The owner does not install anything locally. Supabase (dashboard + SQL Editor)
  and Vercel (auto-deploys on push) are managed in the browser.
- New migrations must also be appended to supabase/setup_all.sql or given as a
  separate paste-able file, with instructions for running them in the SQL Editor.

@AGENTS.md
