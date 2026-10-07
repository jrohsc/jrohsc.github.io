# Research Practice · AI / ML Interview Prep

한국어 중심의 연결형 AI·ML 면접 학습 플랫폼. 배포 URL: https://jrohsc.github.io/interview-prep/

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
- `../interview-prep/data/curriculum.json`: 50 knowledge nodes and 270 subtopics (12 core topics include multi-step derivations, numerical worked examples, 36 independent prompts and 12 debugging cases) with prerequisite/related edges, explanations, math, code, diagrams, sources.
- `../interview-prep/data/questions.json`: 114 original questions, many-to-many topic/company/role references, two hints, answers and concrete self-assessment rubrics. Company tags mean preparation relevance, never actual interview provenance.
- `../interview-prep/data/companies.json`: companies, normalized roles/dimensions, 50 role-specific profiles, 600 importance records. Numeric ratings are all `INFERRED`; official evidence supports narratives, not fabricated numeric frequency estimates. Unknown verification dates are null and displayed as unverified. The math aggregate drives selection; comparison shows subdimensions instead to avoid double counting.

## Extend the curriculum

Add a stable unique topic ID and complete its content fields. Connect prerequisite/related IDs. Add questions that reference it, with stable IDs and 1–5 difficulty/importance, positive expectedTime, two hints and at least three rubric checkpoints. Add sources at the factual claim level. New companies need a profile for every supported role. Evidence values are `OFFICIAL`, `CANDIDATE REPORTED`, or `INFERRED`; never upgrade an inference merely because its background source is official. Run `npm test` to detect broken edges and invalid metadata. Content strings render as text, not executable HTML.

## Learning and persistence

Reviews use an adaptive ease/interval scheduler: Again=10 minutes; Hard grows slowly; Good and Easy expand the interval. Mastery is a bounded self-assessment score and decays after reviews become overdue. Unseen questions count as zero; no metric depends on page views. Daily selection weights due status, explicit weaknesses, role/company relevance, importance, target difficulty, recent practice and deadline; a per-category penalty encourages coverage within the time budget. It is a heuristic, not a validated readiness score or a reproduction of FSRS/Anki.

Local storage key `research-practice:v1` holds settings, answers, reviews, history, bookmarks, mistakes, plan and current/latest mock. A mock uses an absolute deadline, so closing the tab does not pause it. Answers stay hidden until completion; grading is explicit self-assessment. Starting a new mock replaces the previous session; ratings and question review history remain. No login, cloud synchronization, API key or language-model grading is required. Python code is copyable/downloadable but not executed in the browser. NumPy/DSA reference implementations were exercised locally; PyTorch snippets received syntax checks, not runtime testing.

Use Progress → Backup before clearing site data or changing browsers. Import validates types, IDs, ratings and session structure and asks before replacing records. Treat imported JSON as private. Storage failures show a persistent warning and still permit file export. Google Fonts is optional; system fallbacks work without it.

## Validation

- 10 Node tests: scheduler intervals/decay, budgets, diversity, due/weak prioritization, malformed imports, all metadata graph edges and evidence fields.
- 10 browser flows: all pages/diagram, recall+mistake persistence, role comparison, generated plan, mock+recap, mobile navigation/overflow, invalid backup rejection.
- Browser coverage also verifies timeout, valid restoration, corrupt-data preservation and keyboard access.

Company/role profiles are preparation guidance; teams and interview processes vary. Open each company page's source and confidence details before relying on the comparison.
