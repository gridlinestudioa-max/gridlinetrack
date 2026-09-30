# Track Platform: Development Guide

Companion to SPEC.md. The spec says what to build. This guide says how to stay on track while building it. Re-read sections 1 and 2 at the start of every work session.

## 1. The one-sentence product

A designed website plus a "race night engine" that turns one event card into an event page, flyer, social graphics, and email blast, in the track's own brand.

If a task doesn't make that sentence more true, it waits.

## 2. Non-negotiable guardrails

1. **The event card is the spine.** Every output (page, flyer, graphic, email) is generated from it. Never build a feature that needs its own separate data entry.
2. **Link out, don't compete.** No scoring, ticketing, registration, or live timing. External links only.
3. **No scraping other platforms.** Promoter-entered data or explicitly offered embeds only.
4. **Design is the product.** A few excellent templates beat many mediocre ones. Never ship a template you wouldn't put in your portfolio.
5. **Mobile first.** If the promoter can't create an event and a flyer from a phone in under 5 minutes, it isn't done.
6. **One pilot track beats ten features.** Real usage overrides my assumptions.
7. **Minimal dependencies and minimal paid services.** Ask before adding any.

## 3. Scope control

### The "Not Now" list (park ideas here, don't build them)

- Scoring, points, live timing, registration, ticket sales
- Native mobile app
- SMS (email first)
- Multi-user roles and permissions
- Automated custom domains
- AI-written copy
- Sponsor CRM beyond simple inventory
- Marketplace, merch store, fan accounts
- Any feature a single track asks for that others wouldn't use

### The scope-creep test

Before starting anything not in the current phase, answer:

1. Does it make the weekly race night workflow faster or better?
2. Would at least 3 tracks use it?
3. Can it be built in under 2 days? If not, what's the smaller version?

If any answer is no, add it to PARKING_LOT.md with a date and move on.

### The 48-hour rule

New ideas sit in the parking lot for 48 hours before being considered. Most won't survive.

## 4. Phases, with definitions of done

A phase is done only when every box is checked. Don't start the next phase early.

### Phase 0: Validate

- [ ] Shortlist of 3 to 5 target tracks with a clear buying trigger (new ownership, new facility, dated site, complaints about flyers)
- [ ] Spec version built for one real track: designed home page, flyer from their real schedule, mock sponsor report
- [ ] Outreach sent; at least one conversation held
- [ ] Notes recorded: what they currently use, what they pay, what they said they'd pay for

**Gate:** one promoter says they'd use it, or I consciously decide to proceed anyway and record why.

### Phase 1: Foundation

- [ ] Next.js app scaffolded; README lets a fresh clone run locally
- [ ] Supabase schema via SQL migration files; row-level security keyed by track_id
- [ ] Tenant resolution from hostname works in local dev and on Vercel preview
- [ ] Admin: create track, upload logo, set brand kit, create/edit event cards
- [ ] One public site template: home, schedule, event detail
- [ ] Tenant isolation verified: data from track A never appears on track B

**Gate:** I can create a fake track and publish an event page in under 10 minutes.

### Phase 2: Race night engine

- [ ] Flyer generator: print-ready PDF + social-size PNG from the event card
- [ ] Social graphics: announcement, cancellation, thank-you
- [ ] Email blast with preview, send, unsubscribe
- [ ] Fan signup form with consent language
- [ ] Admin polished for phone use

**Gate:** timed test on a phone: new event to flyer in under 5 minutes.

### Phase 3: Templates and pilot

- [ ] Additional templates built and reviewed against the design checklist (section 7)
- [ ] Pilot track onboarded and using it for real events
- [ ] Bug and friction list kept from real use

**Gate:** the pilot promoter uses the event card for at least 3 events without my help.

### Phase 4: Billing and sponsor layer

- [ ] Stripe setup fee + monthly plan, tested end to end (including failed payments and cancellation)
- [ ] Sponsor strip and sponsor page live
- [ ] Sponsor inventory and one-page report

**Gate:** first paying track.

## 5. Weekly rhythm

### Start of session (5 min)

- Read this guide's sections 1 and 2.
- Check the current phase checklist. Pick one item.
- Write the goal for the session in one line at the top of WORKLOG.md.

### During

- One task per Claude Code session where possible. Finish or revert before starting another.
- Commit after each working change, with a message that says why.

### End of session (5 min)

- Update WORKLOG.md: what got done, what broke, what's next.
- Anything new and tempting goes in PARKING_LOT.md.

### Weekly check (15 min, same day each week)

- Am I still in the current phase?
- What's the one thing that would move the pilot forward?
- Have I talked to a real promoter this week? If not, do that before writing more code.

## 6. Working with Claude Code

- Put SPEC.md, this guide, and a short CLAUDE.md in the repo root. Claude Code reads them each session.
- Give one phase or one checklist item at a time. Tell it to stop and summarize at the end.
- Ask for a plan first on anything non-trivial, and read it before approving.
- Require tests on the risky parts: tenant isolation, billing, email consent/unsubscribe.
- Ask it to explain anything you don't understand. You need to be able to maintain this.
- Review every migration and every dependency it adds.
- Commit before big changes so you can roll back.
- Keep prompts specific. "Build the flyer generator" is too big. "Render the event card into a 1080x1350 PNG using the brand kit, template A" is right-sized.

(The suggested CLAUDE.md lives in the repo root as CLAUDE.md.)

## 7. Quality checklists

### Design checklist (every template, flyer, and email)

- [ ] Hierarchy is obvious in 3 seconds: what, when, where
- [ ] Type is legible on a phone in sunlight; contrast passes
- [ ] Uses the track's brand kit; nothing hardcoded
- [ ] Looks distinct for its racing type (dirt, asphalt, road course), not generic "sports"
- [ ] Flyer prints cleanly (bleed, resolution, safe margins)
- [ ] Looks good with bad inputs: long names, tiny logos, low-res images, 12 classes
- [ ] I'd be proud to show it in my portfolio

### Security and trust checklist

- [ ] Tenant isolation tested with two tracks
- [ ] Uploads validated (type, size); images resized
- [ ] Admin routes require auth; no secrets in client code
- [ ] Email: consent recorded, unsubscribe works, sending domain configured
- [ ] Privacy policy and terms pages exist before real subscribers are collected
- [ ] Backups enabled for the database

### "Ready to show a real track" checklist

- [ ] No lorem ipsum, no broken links, no placeholder images
- [ ] Works on an older Android phone and iPhone Safari
- [ ] Loads fast on weak cell signal (test throttled)
- [ ] The promoter flow was tested by someone who isn't me

## 8. Validation checkpoints and kill criteria

Write these down now so it's easier to decide later.

| Checkpoint | Question | If the answer is no |
| --- | --- | --- |
| End of Phase 0 | Did any promoter want this? | Talk to 5 more with a different pitch, or rethink the offer (revenue-share, sponsor focus) |
| Pilot, week 3 | Is the pilot using the event card without being asked? | Find out why; simplify the workflow before adding features |
| 3 tracks live | Are they still using it 30 days in? | Retention problem; fix before growing |
| First payment | Will anyone pay? | Reconsider pricing, or the buyer (promoters vs. sponsors vs. multi-track operators) |

**Pivot triggers:** if after 10 real promoter conversations fewer than 2 would pay, stop building features. Reconsider the buyer, not the code.

## 9. Decision log

Keep DECISIONS.md. Use this format:

```
## YYYY-MM-DD: Decision title
Context: what problem
Options: A, B, C
Chosen: B
Why: one or two lines
Revisit when: trigger
```

Log decisions about: stack changes, pricing, template set, what's in or out of a phase, and any time a guardrail is bent.

## 10. Risk watchlist (review monthly)

- **Building in a vacuum.** Symptom: weeks of coding with no promoter conversation. Fix: talk to one this week.
- **Feature creep.** Symptom: the parking lot is being emptied into the code. Fix: re-read section 3.
- **Service creep.** Symptom: custom work for one track eats the week. Fix: price it as an extra or decline.
- **Template sprawl.** Symptom: five mediocre templates. Fix: cut to the two best.
- **Polishing instead of shipping.** Symptom: another round on a screen nobody has seen. Fix: show it to a real user first.
- **Seasonal timing.** Symptom: missing the window when tracks plan their year. Fix: prioritize the pilot over completeness.
- **Email problems.** Symptom: spam folder or complaints. Fix: pause sending, fix domain setup and consent.

## 11. Files to keep in the repo root

- `SPEC.md`: what to build
- `DEV_GUIDE.md`: this file
- `CLAUDE.md`: short context for Claude Code
- `WORKLOG.md`: session notes, newest first
- `PARKING_LOT.md`: ideas waiting out the 48-hour rule
- `DECISIONS.md`: decision log
- `README.md`: how to run, test, and deploy

## 12. When I feel lost

1. Re-read section 1 (the one-sentence product).
2. Open the current phase checklist and pick the smallest unchecked item.
3. If nothing feels right, talk to a promoter. Their answer beats my guess.
