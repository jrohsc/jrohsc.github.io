# Research Practice · AI / ML Interview Prep

A connected AI/ML interview preparation platform in English. Deployment URL: https://jrohsc.github.io/interview-prep/

## Development and verification

```sh
cd interview-prep-source
npm ci
npm test
npm run build
python3 -m http.server 4187 --bind 127.0.0.1 --directory ..
# In another terminal:
npm run test:browser
```

Open http://127.0.0.1:4187/interview-prep/. For hot-reload development, `npm run dev` serves the same data at http://127.0.0.1:5187/interview-prep/. Playwright needs its Chromium browser (`npx playwright install chromium` on a fresh machine). Production output is `../interview-prep/`; `/interview-prep/` is the fixed Vite base. Hash routes avoid GitHub Pages deep-link 404s. The build only cleans generated `assets/`, preserving JSON data. Existing Jekyll publication runs data/engine tests and rebuilds this application before upload. Source is excluded from Jekyll.

## Architecture

- `src/main.jsx`: accessible React screens, client state, recall, mock sessions, backup/restore.
- `src/engine.js`: pure scheduling, time-aware mastery, weighted selection, import validation.
- `src/Diagrams.jsx`: native interactive SVG explanations; no raster dependencies.
- `src/style.css`: responsive desktop/mobile interface with reduced-motion support.
- `../interview-prep/data/curriculum.json`: 71 knowledge nodes, including dedicated floating-point, mixed-precision, and GPU-performance lessons with prerequisite/related edges, explanations, math, code, diagrams, sources.
- `../interview-prep/data/questions.json`: 156 original questions, many-to-many topic/company/role references, two hints, answers and concrete self-assessment rubrics. Company tags mean preparation relevance, never actual interview provenance.
- `../interview-prep/data/companies.json`: companies, normalized roles/dimensions, 50 role-specific profiles, 600 importance records. Numeric ratings are all `INFERRED`; official evidence supports narratives, not fabricated numeric frequency estimates. Unknown verification dates are null and displayed as unverified. The math aggregate drives selection; comparison shows subdimensions instead to avoid double counting.

## Extend the curriculum

Add a stable unique topic ID and complete its content fields. Connect prerequisite/related IDs. Add questions that reference it, with stable IDs and 1–5 difficulty/importance, positive expectedTime, two hints and at least three rubric checkpoints. Add sources at the factual claim level. New companies need a profile for every supported role. Evidence values are `OFFICIAL`, `CANDIDATE REPORTED`, or `INFERRED`; never upgrade an inference merely because its background source is official. Run `npm test` to detect broken edges and invalid metadata. Content strings render as text; explicit math delimiters are rendered by KaTeX with trust disabled.

## Learning and persistence

Reviews use an adaptive ease/interval scheduler: Again=10 minutes; Hard grows slowly; Good and Easy expand the interval. Mastery is a bounded self-assessment score and decays after reviews become overdue. Unseen questions count as zero; no metric depends on page views. Daily selection weights due status, explicit weaknesses, role/company relevance, importance, target difficulty, recent practice and deadline; a per-category penalty encourages coverage within the time budget. It is a heuristic, not a validated readiness score or a reproduction of FSRS/Anki.

Local storage key `research-practice:v1` holds settings, answers, reviews, history, bookmarks, mistakes, plan and current/latest mock. A mock uses an absolute deadline, so closing the tab does not pause it. Answers stay hidden until completion; grading is explicit self-assessment. Starting a new mock replaces the previous session; ratings and question review history remain. No login, cloud synchronization, API key or language-model grading is required. Python code is copyable/downloadable but not executed in the browser. NumPy/DSA reference implementations were exercised locally; PyTorch snippets received syntax checks, not runtime testing.

Use Progress → Backup before clearing site data or changing browsers. Import validates types, IDs, ratings and session structure and asks before replacing records. Treat imported JSON as private. Storage failures show a persistent warning and still permit file export. Google Fonts is optional; system fallbacks work without it.

## Validation

- 10 Node tests: scheduler intervals/decay, budgets, diversity, due/weak prioritization, malformed imports, all metadata graph edges and evidence fields.
- 10 browser flows: all pages/diagram, recall+mistake persistence, role comparison, generated plan, mock+recap, mobile navigation/overflow, invalid backup rejection.
- Browser coverage also verifies timeout, valid restoration, corrupt-data preservation and keyboard access.

Company/role profiles are preparation guidance; teams and interview processes vary. Open each company page's source and confidence details before relying on the comparison.

## Connected reading experience

The English interface uses continuous lesson sections and a sticky page outline (horizontal on small screens). Knowledge Map displays nine domains, prerequisite and dependent concepts, related edges, an exploration trail, and guided routes. Company badges distinguish exact official-source mentions from inferred role relevance; each mention retains source scope, link, verification date, and applicable roles.

Every lesson includes structured `formulas`: LaTeX, a plain-English explanation, symbol definitions, and a numerical example. `MathText.jsx` supports inline and display math in lessons and question solutions, with local KaTeX fonts and accessible MathML. `Diagrams.jsx` includes interactive probability, optimization, attention, and floating-point explanations. Float comparisons separate exponent range from fraction precision and label hardware-dependent subnormal behavior. Strict content tests parse every equation and verify graph/evidence integrity.

Existing local-storage records and user-authored notes retain their IDs and content. Legacy generated practice reasons are translated only when displayed.

The dashboard opens on a nine-domain knowledge landscape. Concept status prioritizes overdue reviews, then unassessed, learning, and strong (at least 75% question mastery with no due reviews). Domain panels open the full concept list, and selecting a concept reveals connections, company relevance, and its lesson. Daily practice remains a compact side panel.

The default dashboard is a compact vector atlas: nine original SVG glyphs, curved conceptual connections, short labels, and on-demand detail panels. Additional progress resources stay in an expandable section. `src/theme.css` defines the shared slate/white reading palette, blue actions, domain hues, and semantic progress marks; review state also uses distinct shapes. Browser checks cover concise default content, keyboard disclosure, mobile fit, and representative text contrast.

The second curriculum expansion adds two concepts in every category (18 lessons, 36 original questions). Each includes a concept-specific interactive mechanism diagram, worked numerical example, symbol glossary, standalone reference code, debugging prompt, and independent practice. Prerequisite acyclicity and diagram-content coverage are validated. The site revalidates its JSON data on load so newly published concepts appear without clearing learning records.
