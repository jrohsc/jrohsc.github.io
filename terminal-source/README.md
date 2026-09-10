# SENTINEL
A Bloomberg-inspired AI safety and security monitoring website, built with React, Vite and Express.

## Run
```sh
npm install
npm run dev
```
Open http://localhost:5173. For a production build, run `npm run build`, then `npm start`. The server listens on loopback by default.

## Starter desk
The default Live Intelligence Desk follows the local Axiom starter reference at port 4173: dark blue cards and three independently scrolling columns for lab blogs, conference papers and arXiv. Search across titles, authors, institutions and IDs; filter topics, lab publishers or conference venues. F1 / DESK opens this view. The daily briefing and landscape remain available in the sidebar.

## Daily briefing
The daily Bloomberg-style briefing keeps black panels, orange headers, terminal navigation and a scrolling paper ticker. Toggle headlines in the view bar. Review three prioritized papers, scan activity by area, and open the landscape for broader trends. Briefs use metadata and abstract excerpts; relevance explanations are not independent assessments of findings. Visit baselines, reviewed states and bookmarks persist in this browser. F4 or BRIEF opens the briefing.

Group / institution labels use author affiliations supplied by arXiv, OpenAlex or Crossref. `/api/affiliations` progressively enriches missing affiliations in batches of 18 (three concurrent lookups). It checks the exact-title-matched arXiv HTML affiliation section, then individual OpenAlex title/first-author matches. Opening an arXiv paper prioritizes its lookup. Successful results persist; missing results retry after seven days, errors after one hour. Direct paper evidence takes precedence over index labels. Wrapped names are preserved and duplicate spelling variants collapse. Evidence links and unresolved lookup states appear in paper details. HTML conversion can omit affiliations; the PDF may list additional institutions. Venue labels use proceedings metadata; an arXiv preprint is not assumed accepted at a conference.

## Daily landscape workflow
Overview (`TOP`, `MAP`, or F2) is a landscape rather than a paper list:
1. Use the bubble plot to compare topic activity (vertical log count), share shift (horizontal), and relative volume (bubble size). Scan the five field groups to see activity across all 28 areas.
2. Inspect topic-share changes over 7, 14, or 30 complete UTC days compared with the preceding equal window.
3. Use the eight-week heatmap to distinguish recurring activity from one publication batch.
4. Click an area, heatmap cell, or topic intersection to inspect the underlying evidence. Open filtered feed preserves the topic intersection and date window.
5. Open the conference radar or `CONF` / F9 to browse proceedings by venue.

Research papers are the default analytical dataset. Research trends use papers only; lab blog posts have a separate feed. These are descriptive trends in the locally indexed sample, not estimates of the whole research field or threat severity. Topic tags overlap. Momentum is a change in topic share (percentage points), only shown when both windows have at least 20 items and the topic has at least 5 combined matches. Current incomplete UTC day and month/year-only dates are excluded. Heatmap color uses a common log count scale. Intersections use Jaccard overlap with at least three shared items; this is keyword co-occurrence, not citation or semantic similarity.

## Conference coverage
`/api/conferences` refreshes hourly and retains up to 3,000 records, searching from January 1 two calendar years ago through today. OpenAlex queries (up to 200 each) target named ML/NLP/vision/security source indexes and broader conference-paper metadata. Crossref queries (up to 100 each) search proceedings articles around hallucination, adversarial research, privacy and ransomware. Each query reports its own status and matched count in settings.

OpenAlex venue indexes can be sparse or stale, so a configured venue does not guarantee its latest proceedings are covered. Crossref and OpenAlex venue/series labels are preserved; a generic proceedings series is not relabeled as a specific conference. Missing abstracts are marked. Dates and publication types are index metadata, not independently verified acceptance decisions. Search caps mean this is sampled proceedings coverage, not complete archives for every conference. No OpenReview submissions are assumed to be accepted papers.

Paper versions are merged when DOI, explicit arXiv ID, or normalized exact title plus first author agree. The earliest source publication date is used for research trends; the proceedings date is separately retained. Unmatched duplicates may remain. An optional server-only `OPENALEX_API_KEY` can be set if the unauthenticated service returns rate limits.

## Features
- Live arXiv metadata, five-minute cached polling, persistent disk cache and explicit stale/error states.
- 28 overlapping keyword-classified research channels, abstract inspector, author search, date filters and sorting.
- Reading queue and keyword watchlist stored in your browser, JSON export, and browser notifications for new matches while open.
- Activity and topic charts computed from indexed papers.
- Publishing group / institution and conference / venue labels where source metadata is available.

## Cybersecurity papers
The `CYB` command or F5 opens cybersecurity research papers, including general cs.CR research and malware/network/software security work. Vulnerability/advisory feeds remain disabled. Official lab blog posts are enabled separately; social feeds remain disabled.

## Official safety and alignment blogs
`/api/blogs` polls 13 official feeds/indexes every 15 minutes while open: Anthropic Research and Alignment Science, Google DeepMind, Google Research, NVIDIA Blog and Technical Blog, OpenAI, Microsoft Research, Meta AI, Hugging Face, METR, Redwood Research and UK AISI. RSS/Atom sources contribute available entries; HTML sources inspect up to 30 recent links and fetch up to 18 unseen article pages per sync. Up to 3,000 matched posts persist in `data/blog-cache.json`. Broad lab feeds are safety-keyword filtered; dedicated safety research blogs are retained as such. This is sampled coverage, not an exhaustive historical archive.

Lab blogs have publisher/institution filters, search, topic/date controls, bookmarks, original links, a briefing sidebar and scrolling headlines. Watchlist matching includes posts. Publisher identity comes from the official host, and does not imply all authors are employees. Unknown publication dates remain unknown and sort after dated posts; month-only dates are excluded from rolling day filters. Per-source connection errors and counts appear in Lab blogs. Cached papers render immediately while arXiv refreshes in the background.

## Coverage
The six query families in `feed.js` each retrieve up to 200 newest keyword-matched arXiv papers, then deduplicate by paper ID. Up to 5,000 are retained in `data/cache.json`. Requests are serial and separated by at least three seconds. Partial failures retain successful results and report each family’s status in Sources & preferences. Searches include vision, audio, robotics, human interaction, and societal computing categories as well as AI/ML and explicit AI terminology. Multimodal and human/agent queries also require safety-adjacent keywords.

The shared taxonomy in `shared/topics.js` covers adversarial robustness, alignment, interpretability, evaluation, privacy/security, governance, multimodal/vision, audio/speech, personalization/memory, hallucination/reliability, deepfakes/provenance, agents/tools, fairness/bias, harmful content/misuse, misinformation/persuasion, robotics, human wellbeing, data/model integrity, malware/ransomware, networks, CVEs, software security, cloud/containers, identity/phishing, cryptography, threat intelligence/response, supply chains, and IoT/industrial systems. Existing cached and bookmarked papers are reclassified on load. This is not exhaustive research coverage and does not crawl every journal, conference, social account or institutional site. arXiv publishes on its own schedule; five-minute polling does not imply immediate publication. Topic assignments are heuristic. Charts represent the local indexed sample.

Alerts require browser notification permission and an open terminal. There is no hosted deployment, background notification worker, email digest or cross-device sync. Keep the local server running for daily use.

## Validation
`npm test` checks Atom parsing, normalization and classification; `npm run build` builds production assets. `node check-desk.mjs` verifies the three-feed starter, live blog sources, institution filters, bookmarks and responsive layout. `node check-briefing.mjs` verifies the Bloomberg briefing, labels, navigation and mobile width. `node check-landscape.mjs` verifies map/heatmap drill-down, conference navigation, evidence links, dataset/window controls and mobile width. `node check-browser.mjs` runs the desktop/mobile smoke check using installed Google Chrome and a local server. The browser check adds a bookmark and test keyword in its isolated browser profile.

API references: https://info.arxiv.org/help/api/user-manual.html
