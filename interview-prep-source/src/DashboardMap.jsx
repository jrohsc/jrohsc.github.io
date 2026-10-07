import React, { useState, useRef } from "react";
import { ArrowRight, Compass, Search, X } from "lucide-react";
import { categories, effectiveMastery } from "./engine";
import "./dashboard-map.css";

const domains = [
  { id: "math", name: "Mathematics", x: 14, y: 46 },
  { id: "ml", name: "Machine learning", x: 38, y: 25 },
  { id: "dl", name: "Deep learning", x: 64, y: 25 },
  { id: "llm", name: "Language models", x: 87, y: 46 },
  { id: "systems", name: "GPU & systems", x: 64, y: 74 },
  { id: "mlcoding", name: "ML coding", x: 38, y: 74 },
  { id: "dsa", name: "Algorithms", x: 14, y: 84 },
  { id: "research", name: "Research", x: 14, y: 9 },
  { id: "domain", name: "Specializations", x: 87, y: 84 },
];
const links = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 5],
  [4, 5],
  [3, 4],
  [6, 5],
  [7, 1],
  [8, 3],
];
function DomainGlyph({ kind }) {
  const dots = (pts) =>
    pts.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" stroke="none" />
    ));
  let shape;
  if (kind === "math")
    shape = (
      <>
        <path d="M8 40H48M12 44V8" opacity=".35" />
        <path d="M14 36C22 36 22 14 29 14S36 36 46 36" />
        <path d="M29 13V37" strokeDasharray="2 3" opacity=".4" />
      </>
    );
  else if (kind === "ml")
    shape = (
      <>
        <path d="M9 40L45 12" />
        {dots([
          [12, 31],
          [18, 35],
          [23, 22],
          [30, 25],
          [36, 13],
          [44, 19],
        ])}
      </>
    );
  else if (kind === "dl")
    shape = (
      <>
        {[
          [13, 13],
          [13, 28],
          [13, 43],
        ].map(([x, y]) =>
          [14, 28, 42].map((z) => (
            <path
              key={`${y}-${z}`}
              d={`M${x} ${y}L29 ${z}L45 28`}
              opacity=".3"
            />
          )),
        )}
        {dots([
          [13, 13],
          [13, 28],
          [13, 43],
          [29, 14],
          [29, 28],
          [29, 42],
          [45, 28],
        ])}
      </>
    );
  else if (kind === "llm")
    shape = (
      <>
        {[0, 1, 2, 3].flatMap((i) =>
          [0, 1, 2, 3].map((j) => (
            <rect
              key={`${i}-${j}`}
              x={10 + j * 10}
              y={10 + i * 10}
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
              opacity={j > i ? 0.1 : 0.3 + (i === j ? 0.6 : 0)}
              stroke="none"
            />
          )),
        )}
      </>
    );
  else if (kind === "systems")
    shape = (
      <>
        <rect x="15" y="15" width="26" height="26" rx="4" />
        <rect
          x="22"
          y="22"
          width="12"
          height="12"
          rx="2"
          fill="currentColor"
          opacity=".25"
        />
        {[20, 28, 36].map((v) => (
          <path key={v} d={`M${v} 8V15M${v} 41V48M8 ${v}H15M41 ${v}H48`} />
        ))}
      </>
    );
  else if (kind === "mlcoding")
    shape = (
      <>
        <path d="M18 17L8 28L18 39M38 17L48 28L38 39M32 11L24 45" />
      </>
    );
  else if (kind === "dsa")
    shape = (
      <>
        <path d="M28 12V24M13 38V24H43V38" />
        {dots([
          [28, 10],
          [13, 41],
          [28, 24],
          [43, 41],
        ])}
      </>
    );
  else if (kind === "research")
    shape = (
      <>
        <path d="M9 41H47" opacity=".3" />
        <path d="M17 38V26M28 38V18M39 38V11" strokeWidth="5" />
        <path d="M13 21L27 12L39 6" opacity=".4" />
      </>
    );
  else
    shape = (
      <>
        <circle cx="22" cy="23" r="12" />
        <circle cx="35" cy="23" r="12" />
        <circle cx="28" cy="35" r="12" />
      </>
    );
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shape}
    </svg>
  );
}
const labels = {
  unseen: "Not assessed",
  learning: "Learning",
  due: "Review due",
  strong: "Strong",
};
export function conceptStatus(topicId, questions, reviews, now = Date.now()) {
  const qs = questions.filter((q) => q.topics.includes(topicId));
  const assessed = qs.filter((q) => reviews[q.id]);
  const due = assessed.filter((q) => reviews[q.id].nextReview <= now).length;
  const mastery = qs.length
    ? Math.round(
        qs.reduce((n, q) => n + effectiveMastery(reviews[q.id], now), 0) /
          qs.length,
      )
    : 0;
  return {
    status: due
      ? "due"
      : !assessed.length
        ? "unseen"
        : mastery >= 75
          ? "strong"
          : "learning",
    mastery,
    assessed: assessed.length,
    total: qs.length,
    due,
  };
}
export function DashboardMap({
  topics,
  questions,
  reviews,
  renderCompanies,
  practice,
}) {
  const [selected, setSelected] = useState(null),
    [domain, setDomain] = useState(null),
    [query, setQuery] = useState("");
  const detail = useRef(null);
  const reveal = () =>
    requestAnimationFrame(() => {
      if (innerWidth <= 1150)
        detail.current?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
    });
  const selectDomain = (cat) => {
    setDomain(cat);
    setSelected(null);
    reveal();
  };
  const current = topics.find((t) => t.id === selected);
  const states = Object.fromEntries(
    topics.map((t) => [t.id, conceptStatus(t.id, questions, reviews)]),
  );
  const matches = query.trim()
    ? topics.filter((t) =>
        `${t.title} ${t.subtopics.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      )
    : [];
  const select = (id) => {
    setSelected(id);
    setDomain(null);
    setQuery("");
    reveal();
  };
  const related = current
    ? [
        ...new Set([
          ...current.prerequisites,
          ...current.related,
          ...topics
            .filter((t) => t.prerequisites.includes(current.id))
            .map((t) => t.id),
        ]),
      ].filter((id) => id !== current.id)
    : [];
  const topicButton = (t) => (
    <button
      key={t.id}
      className={`atlas-topic status-${states[t.id].status}`}
      onClick={() => select(t.id)}
      aria-pressed={selected === t.id}
    >
      <i aria-hidden="true" />
      <span>{t.title}</span>
      <span className="atlas-sr"> · {labels[states[t.id].status]}</span>
    </button>
  );
  return (
    <section
      className={`dashboard-atlas ${current || domain ? "has-selection" : ""}`}
      aria-label="Your knowledge landscape"
    >
      <div className="atlas-main">
        <div className="atlas-toolbar">
          <span className="eyebrow">
            KNOWLEDGE ATLAS <small> / 09 FIELDS</small>
          </span>
          <div>
            <label className="atlas-search">
              <Search size={15} />
              <span className="atlas-sr">Find a dashboard concept</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a concept…"
              />
            </label>
            <a
              href="#/map"
              className="atlas-expand"
              aria-label="Explore full map"
            >
              <Compass size={18} />
            </a>
          </div>
        </div>
        {query.trim() && (
          <div className="atlas-results" aria-label="Matching concepts">
            <small role="status">{matches.length} matching concepts</small>
            {matches.map(topicButton)}
          </div>
        )}
        <div className="atlas-grid" aria-label="Connected fields">
          <svg
            className="atlas-edges"
            viewBox="0 0 1000 550"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {links.map(([a, b]) => {
              const A = domains[a],
                B = domains[b];
              return (
                <path
                  key={`${a}-${b}`}
                  className={
                    domain && [A.id, B.id].includes(domain) ? "lit" : ""
                  }
                  d={`M ${A.x * 10} ${A.y * 5.5} C ${(A.x + B.x) * 5} ${A.y * 5.5}, ${(A.x + B.x) * 5} ${B.y * 5.5}, ${B.x * 10} ${B.y * 5.5}`}
                />
              );
            })}
          </svg>
          <svg
            className="atlas-edges atlas-edges-mobile"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {links.map(([a, b]) => (
              <path
                key={`${a}-${b}`}
                d={`M ${16 + (a % 3) * 34} ${17 + Math.floor(a / 3) * 33} L ${16 + (b % 3) * 34} ${17 + Math.floor(b / 3) * 33}`}
              />
            ))}
          </svg>
          <span className="atlas-watermark" aria-hidden="true">
            AI / ML
          </span>
          {domains.map(({ id: cat, name, x, y }, index) => {
            const group = topics.filter((t) => t.category === cat),
              due = group.filter((t) => states[t.id].status === "due").length;
            const assessed = group.filter(
              (t) => states[t.id].assessed > 0,
            ).length;
            const status = due
              ? "due"
              : !assessed
                ? "unseen"
                : group.every((t) => states[t.id].status === "strong")
                  ? "strong"
                  : "learning";
            return (
              <button
                key={cat}
                data-domain={cat}
                className={`atlas-domain status-${status} ${domain === cat || current?.category === cat ? "atlas-selected" : ""}`}
                style={{
                  "--x": x + "%",
                  "--y": y + "%",
                  "--mx": 16 + (index % 3) * 34 + "%",
                  "--my": 17 + Math.floor(index / 3) * 33 + "%",
                }}
                onClick={() => selectDomain(cat)}
                aria-pressed={domain === cat}
                aria-label={`${name} · ${group.length} concepts · ${due ? `${due} topics need review` : labels[status]}`}
              >
                <span className="atlas-glyph">
                  <DomainGlyph kind={cat} />
                  <i className="atlas-node-status" />
                </span>
                <span className="atlas-node-name">{name}</span>
                <span className="atlas-node-count">
                  {due ? `${due} due` : `${group.length} concepts`}
                </span>
              </button>
            );
          })}
        </div>
        <div className="atlas-footer">
          <span>Choose a field to explore</span>
          <div className="atlas-legend" aria-label="Learning status legend">
            {Object.entries(labels).map(([id, label]) => (
              <span key={id} className={`status-${id}`}>
                <i />
                {label}
              </span>
            ))}
          </div>
          <details className="atlas-method">
            <summary aria-label="About connections and mastery">ⓘ</summary>
            <p>
              Lines show conceptual connections, not prerequisites. Status
              reflects question self-assessments. Strong means at least 75%
              mastery with no reviews due.
            </p>
          </details>
        </div>
      </div>
      <aside
        className="atlas-rail"
        aria-label="Concept details and daily practice"
      >
        {(current || domain) && (
          <div ref={detail} className="atlas-detail" aria-live="polite">
            {(current || domain) && (
              <button
                className="atlas-close icon-button"
                aria-label="Clear concept selection"
                onClick={() => {
                  setSelected(null);
                  setDomain(null);
                }}
              >
                <X size={16} />
              </button>
            )}
            {current ? (
              <>
                <span className="eyebrow">FOLLOW THE CONNECTION</span>
                <h3>{current.title}</h3>
                <span
                  className={`atlas-status status-${states[current.id].status}`}
                >
                  <i />
                  {labels[states[current.id].status]} ·{" "}
                  {states[current.id].mastery}% mastery
                </span>
                <p>{current.summary}</p>
                <a className="button small" href={`#/study/${current.id}`}>
                  Open lesson <ArrowRight size={14} />
                </a>
                <h4>Connected concepts</h4>
                <div className="atlas-connections">
                  {related.map((id) => {
                    const t = topics.find((t) => t.id === id);
                    return (
                      t && (
                        <button key={id} onClick={() => select(id)}>
                          <small>
                            {current.prerequisites.includes(id)
                              ? "Build on"
                              : t.prerequisites.includes(current.id)
                                ? "Unlocks"
                                : "Related"}
                          </small>
                          {t.title}
                          <ArrowRight size={12} />
                        </button>
                      )
                    );
                  })}
                </div>
                <h4>Company relevance</h4>
                {renderCompanies(current)}
                <a className="atlas-evidence" href={`#/study/${current.id}`}>
                  View source scope and evidence in the lesson →
                </a>
              </>
            ) : domain ? (
              <>
                <span className="eyebrow">EXPLORE A FIELD</span>
                <h3>{categories[domain]}</h3>

                {topics.filter((t) => t.category === domain).map(topicButton)}
              </>
            ) : (
              <>
                <span className="eyebrow">START ANYWHERE</span>
                <h3>Find your place in the big picture.</h3>
                <p>
                  Choose a concept to see what it builds on, where it leads, and
                  which companies mention it.
                </p>
                <a href="#/map/floating-point" className="atlas-feature">
                  Follow a thread
                  <br />
                  <strong>BF16 → Mixed precision → GPU systems</strong>
                  <ArrowRight size={16} />
                </a>
              </>
            )}
          </div>
        )}
      </aside>
      <div className="atlas-practice-wrap">{practice}</div>
    </section>
  );
}
