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
```

The UI check uses installed Chrome on macOS, or Playwright Chromium elsewhere
(`npx playwright install chromium`). It runs in a fresh browser context and
never submits applications.

## Collection and coverage

`sources.mjs` defines employer priority and official boards. `adapters.mjs`
supports Google Careers, Apple, Amazon, Microsoft Research, Workday, Ashby,
Greenhouse, Lever and Dolby. Meta and Qualcomm have explicit manual links,
because their public boards were not available to the automatic collector.
Microsoft Research can return 403; this is shown as unavailable, not zero jobs.
Apple and other paginated boards have a bounded page limit, surfaced as partial
coverage. The monitor cannot guarantee every available role.

The site's existing 15-minute Pages schedule reuses the latest deployed snapshot
until it is 120 minutes old. Collection is approximately every two hours and
depends on GitHub's scheduler and source availability. A browser reload fetches
the latest published data; it does not start a new employer crawl. Open tabs
reload the published feed every five minutes. Manual workflow dispatch is also
available. Collection requires no paid service or API key.

The collector reads the published snapshot first to preserve `firstSeen` and
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

To diagnose individual sources: `node collect.mjs --sources=apple,google`.
This preserves unscanned sources. Full runs should be used for publication.
The source directory is excluded from Jekyll output.
