# AI Opportunity Radar

Public page: <https://jrohsc.github.io/ai-jobs/>. Static HTML/CSS/JavaScript,
with a Node collector that reads official public career boards. The existing
GitHub Pages workflow publishes both this page and the personal website.

## Run

```sh
cd jobs-source
npm ci
npm test
npm run collect
npm run preview
# In a second terminal, with preview running:
node check-ui.mjs
node check-contacts.mjs
```

The UI check uses installed Chrome on macOS, or Playwright Chromium elsewhere
(`npx playwright install chromium`). It runs in a fresh browser context and
never submits applications.

## Collection and coverage

`sources.mjs` defines employer priority and official boards. `adapters.mjs`
supports Google Careers, Apple, Amazon, Workday, Ashby, Greenhouse, Lever and
Dolby. `public-careers.mjs` reads the public Microsoft/Qualcomm Eightfold boards
and Meta's logged-out careers search, then verifies individual descriptions.
Rate limits and missing descriptions are shown as partial coverage, not zero jobs.
Apple and Dolby detail pages supply degree requirements missing from summaries.
Apple general-interest talent pools are labeled, not counted as specific openings.
Apple and other paginated boards have a bounded page limit, surfaced as partial
coverage. The monitor cannot guarantee every available role.

Company groups follow the requested priority: Big Tech, Major AI companies,
then Specialist teams. Major AI companies includes OpenAI, Anthropic, Scale AI,
Together AI, Cohere, xAI and Mistral AI. The group filter combines with the
internship/full-time tabs and topic filters; the company picker lists employers
in the selected group. These priority groups are curated, not a size ranking.

The dedicated `ai-jobs-feed.yml` workflow schedules collection every five minutes,
independently of the existing Pages/research build. It atomically commits the
feed and its small revision manifest. The browser checks the public raw GitHub
manifest every 30 seconds and downloads the full feed only when it changes.
Search, category, saved roles and application states survive these updates.
Switching back to a hidden tab or going online triggers an immediate check.
The initial category is Internships with the PhD research filter enabled. The
posting must include doctoral eligibility and research evidence; broader
engineering/research intakes are labeled separately. AI safety/security are
preferences, not requirements. Full-time, All roles and Unspecified are
available as keyboard-accessible category tabs.

This is polling, not an employer push stream. GitHub's scheduler, crawl duration,
CDN caches and source availability can delay updates beyond five minutes. The
page shows both the latest successful page check and the feed collection time.
It warns when the collection is overdue or the connection fails. A failed
refresh never clears existing results or replaces them with an older snapshot.
If the raw feed cannot be reached on first load, the deployed Pages snapshot is
used as a labeled backup. Manual workflow dispatch is also available. No paid
service or API key is required.

The collector reads the latest raw snapshot first to preserve `firstSeen` and
history across ephemeral CI runners. On failure, it falls back to the checked-in
snapshot. Failed or partial scans preserve missing jobs as `unverified`.
Only a complete, non-anomalous scan marks missing jobs `not-listed`; that is not
a definitive employer closure. Missing jobs stay in the feed for 30 days.
An anomalous drop below 35% of a previously populated source preserves old jobs.

US availability must be explicit in the source's locations. Unspecified remote
locations are not assumed to allow US employment. Internship wording overrides
full-time hours. Non-internship contract and part-time roles are excluded;
unknown employment types are labeled rather than assumed to be full-time.
Publication dates, discovery dates and verification dates are distinct.
Topic matching strips standard company introductions and recruiting footers.
Related AI research is a separate category for broad research internships.

## Local tracker

Saved and application states live only in browser localStorage under
`ai-radar-tracker-v1`. The public feed contains no application state or resume.
Export/import JSON transfers the tracker between browsers. Opening an employer
link does not imply that an application was submitted. Applications happen on
the employer's own website.

## Files and checks

- `../ai-jobs/`: directly published static files and data snapshot.
- `model.mjs`: relevance, US scope, employment types and refresh reconciliation.
- `test/`: meaningful regression tests for false positives, internship
  classification, safe URLs, adapter parsing, deduplication and outage behavior.
- `check-ui.mjs`: local browser interaction and responsive checks.
- `check-contacts.mjs`: draft editing, safe backup/import, contact status,
  mobile layout and expiring hiring evidence. Defaults to local port 8767;
  set `CONTACTS_TEST_URL` to use the `npm run preview` port (8766).

## Research contacts

`../ai-jobs/contacts/` is the separate outreach workspace linked from the radar.
Public sources and personalized English drafts are curated in `data.mjs` using
the October 6, 2026 CV and current research direction. It distinguishes confirmed
2027 PhD recruitment, year-unspecified/group opportunities, pooled engineering
intakes and research-fit contacts with no confirmed opening. Individual hosting
and US placement are never inferred from a team's general posting.

This curation is not updated by the five-minute jobs workflow. Re-check public
affiliations, contact routes and current hiring evidence before updating each
contact's `verifiedAt`. After 30 days (or an explicit deadline), hiring links and
active recruiting badges are hidden until re-verified. Priority-review dates
and Workday's "at least until" dates are not treated as hard application deadlines.
Research/profile links remain available. Old hiring posts are not sources for
current openings. X profile links do not imply verified X hiring posts.

Draft edits, dates, notes and status are stored only in browser localStorage
under `ai-radar-contacts-v1`, with JSON export/import. Opening profiles or mailto
composers and copying text never mark a contact as sent. This page has no mail/DM
sending integration. The private CV and internal proposal are not uploaded;
drafts reference existing public papers and a short in-progress research pitch.

To diagnose individual sources: `node collect.mjs --sources=apple,google`.
This preserves unscanned sources. Full runs should be used for publication.
The source directory is excluded from Jekyll output.
