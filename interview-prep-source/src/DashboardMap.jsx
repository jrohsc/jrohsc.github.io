import React, { useState, useRef } from "react";
import { ArrowRight, Compass, Search, X } from "lucide-react";
import { categories, effectiveMastery } from "./engine";
import "./dashboard-map.css";

const domains = [
  "math",
  "ml",
  "dl",
  "dsa",
  "mlcoding",
  "llm",
  "research",
  "systems",
  "domain",
];
const links = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 4],
  [4, 5],
  [3, 6],
  [4, 7],
  [5, 8],
  [6, 7],
  [7, 8],
];
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
      if (innerWidth <= 980)
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
    <section className="dashboard-atlas" aria-label="Your knowledge landscape">
      <div className="atlas-main">
        <div className="atlas-heading">
          <div>
            <span className="eyebrow">THE BIG PICTURE</span>
            <h2>Your knowledge landscape</h2>
          </div>
          <a href="#/map" className="atlas-expand">
            <Compass size={15} /> Explore full map <ArrowRight size={14} />
          </a>
        </div>
        <div className="atlas-legend" aria-label="Learning status legend">
          {Object.entries(labels).map(([id, label]) => (
            <span key={id} className={`status-${id}`}>
              <i />
              {label}
            </span>
          ))}
        </div>
        <label className="atlas-search">
          <Search size={16} />
          <span className="atlas-sr">Find a dashboard concept</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a concept: Bayes, attention, BF16…"
          />
        </label>
        {query.trim() && (
          <div className="atlas-results" aria-label="Matching concepts">
            <small role="status">{matches.length} matching concepts</small>
            {matches.map(topicButton)}
          </div>
        )}
        <div className="atlas-grid">
          <svg
            className="atlas-edges"
            viewBox="0 0 600 600"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {links.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={100 + (a % 3) * 200}
                y1={100 + Math.floor(a / 3) * 200}
                x2={100 + (b % 3) * 200}
                y2={100 + Math.floor(b / 3) * 200}
              />
            ))}
          </svg>
          {domains.map((cat) => {
            const group = topics.filter((t) => t.category === cat),
              due = group.filter((t) => states[t.id].status === "due").length;
            const assessed = group.filter(
              (t) => states[t.id].assessed > 0,
            ).length;
            const ordered = [...group].sort(
              (a, b) =>
                (states[b.id].status === "due") -
                (states[a.id].status === "due"),
            );
            return (
              <article
                key={cat}
                className={`atlas-domain ${domain === cat || current?.category === cat ? "atlas-selected" : ""}`}
              >
                <button
                  className="atlas-domain-title"
                  onClick={() => selectDomain(cat)}
                  aria-pressed={domain === cat}
                >
                  <h3>{categories[cat]}</h3>
                  <ArrowRight size={13} />
                </button>
                <small>
                  {due
                    ? `${due} topics need review`
                    : `${assessed} / ${group.length} topics assessed`}
                </small>
                <div className="atlas-topic-list">
                  {ordered.slice(0, 2).map(topicButton)}
                </div>
                <button
                  className="atlas-browse"
                  onClick={() => selectDomain(cat)}
                >
                  View all {group.length} concepts
                </button>
              </article>
            );
          })}
        </div>
        <p className="atlas-note">
          Lines connect fields, not a required study order. Status comes from
          question self-assessments; reading a page does not increase mastery.
        </p>
      </div>
      <aside
        className="atlas-rail"
        aria-label="Concept details and daily practice"
      >
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
              <p>
                Select a concept to see its connections and company relevance.
              </p>
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
        {practice}
      </aside>
    </section>
  );
}
