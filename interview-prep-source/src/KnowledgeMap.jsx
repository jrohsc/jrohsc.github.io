import React, { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Layers,
  RotateCcw,
  Search,
} from "lucide-react";
import "./knowledge-map.css";

const DOMAINS = [
  {
    id: "math",
    title: "Mathematical foundations",
    short: "Math",
    note: "Describe uncertainty, change, and structure.",
    x: 18,
    y: 17,
  },
  {
    id: "ml",
    title: "Machine learning",
    short: "ML",
    note: "Turn assumptions and data into predictions.",
    x: 50,
    y: 17,
  },
  {
    id: "dl",
    title: "Deep learning",
    short: "Deep learning",
    note: "Learn representations through differentiable models.",
    x: 82,
    y: 17,
  },
  {
    id: "dsa",
    title: "Algorithms & data structures",
    short: "Algorithms",
    note: "Reason about correctness and computational cost.",
    x: 18,
    y: 50,
  },
  {
    id: "mlcoding",
    title: "ML implementation",
    short: "ML coding",
    note: "Translate equations into stable, tested code.",
    x: 50,
    y: 50,
  },
  {
    id: "llm",
    title: "Language models & modern AI",
    short: "Modern AI",
    note: "Connect pretraining, alignment, retrieval, and generation.",
    x: 82,
    y: 50,
  },
  {
    id: "research",
    title: "Research reasoning",
    short: "Research",
    note: "Test explanations with controlled experiments.",
    x: 18,
    y: 83,
  },
  {
    id: "systems",
    title: "ML systems",
    short: "Systems",
    note: "Fit training and inference into real resource budgets.",
    x: 50,
    y: 83,
  },
  {
    id: "domain",
    title: "Domain tracks",
    short: "Specialize",
    note: "Apply shared foundations to vision, speech, multimodal AI, and safety.",
    x: 82,
    y: 83,
  },
];
const PATHS = [
  {
    id: "causal",
    title: "From probability to causal evidence",
    note: "Separate observing a pattern from estimating an intervention, then plan an informative experiment.",
    ids: [
      "probability",
      "conditional-expectation",
      "causal-inference",
      "research-design",
      "power-analysis",
    ],
  },
  {
    id: "generative",
    title: "From representations to generative models",
    note: "Connect learned similarity, denoising, and multimodal representations.",
    ids: [
      "neural-networks",
      "contrastive-learning",
      "diffusion-models",
      "multimodal",
    ],
  },
  {
    id: "execution",
    title: "From gradients to distributed execution",
    note: "Follow a derivative through an autodiff engine, recomputation, and collective communication.",
    ids: [
      "backprop",
      "ml-code-autograd",
      "activation-checkpointing",
      "distributed",
      "collective-communication",
    ],
  },
  {
    id: "precision",
    title: "From numeric formats to GPU performance",
    note: "Follow precision and range into stable training, memory budgets, and measured throughput.",
    ids: [
      "floating-point",
      "mixed-precision",
      "gpu",
      "gpu-performance",
      "distributed",
      "serving",
    ],
  },
  {
    id: "language",
    title: "From probability to language models",
    note: "Connect uncertainty, a stable implementation, and modern model training.",
    ids: [
      "probability",
      "information",
      "ml-code-softmax",
      "attention",
      "transformers",
      "llm-training",
      "preference",
    ],
  },
  {
    id: "learning",
    title: "From derivatives to a training system",
    note: "Follow the route from a local gradient to distributed execution.",
    ids: [
      "calculus",
      "backprop",
      "ml-code-network",
      "ml-code-optimizers",
      "ml-code-training",
      "gpu",
      "distributed",
    ],
  },
  {
    id: "evidence",
    title: "From uncertainty to research evidence",
    note: "Connect estimation, evaluation, and a defensible research claim.",
    ids: [
      "probability",
      "statistics",
      "experiments",
      "evaluation",
      "research-design",
      "research-evaluation",
      "paper-critique",
    ],
  },
];
const DOMAIN_LINKS = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [2, 5],
  [4, 5],
  [3, 6],
  [4, 7],
  [5, 8],
  [6, 7],
  [7, 8],
];
const unique = (values) => [...new Set(values)];
function neighborhood(topics, id) {
  const index = new Map(topics.map((t) => [t.id, t]));
  const current = index.get(id);
  const prerequisites = unique(current?.prerequisites || [])
    .map((x) => index.get(x))
    .filter(Boolean);
  const usedBy = topics.filter((t) => (t.prerequisites || []).includes(id));
  const occupied = new Set([
    id,
    ...prerequisites.map((t) => t.id),
    ...usedBy.map((t) => t.id),
  ]);
  const relatedIds = unique([
    ...(current?.related || []),
    ...topics.filter((t) => (t.related || []).includes(id)).map((t) => t.id),
  ]);
  const related = relatedIds
    .filter((x) => !occupied.has(x))
    .map((x) => index.get(x))
    .filter(Boolean);
  return { current, prerequisites, usedBy, related };
}
function Legend({ overview = false }) {
  return (
    <div className="km-legend">
      <span>
        <i className="km-line" />
        {overview
          ? "Conceptual connection"
          : "Prerequisite → dependent concept"}
      </span>
      {!overview && (
        <span>
          <i className="km-line km-dashed" />
          Related concept · no prerequisite claim
        </span>
      )}
    </div>
  );
}
function TopicButton({ topic, onSelect, className = "", style, badge }) {
  return (
    <button
      type="button"
      className={`km-node ${className}`}
      style={style}
      onClick={() => onSelect(topic.id)}
    >
      <span className="km-node-kind">
        {badge ||
          DOMAINS.find((d) => d.id === topic.category)?.short ||
          "Topic"}
      </span>
      <strong>{topic.title}</strong>
    </button>
  );
}

export function ConceptConnections({ topics = [], topicId, onExplore }) {
  const { current, prerequisites, usedBy, related } = useMemo(
    () => neighborhood(topics, topicId),
    [topics, topicId],
  );
  if (!current) return null;
  return (
    <section className="km-mini" aria-label="Concept connections">
      <div className="km-mini-heading">
        <div>
          <span className="km-eyebrow">THE BIG PICTURE</span>
          <h3>Where this concept fits</h3>
        </div>
        <button
          type="button"
          className="km-action"
          onClick={() => onExplore?.(topicId)}
        >
          <Compass size={16} /> Explore map
        </button>
      </div>
      <div className="km-mini-grid">
        {[
          ["Build on", prerequisites, "Prerequisites for this lesson"],
          [
            "Unlocks",
            usedBy,
            "Concepts that list this lesson as a prerequisite",
          ],
          [
            "Connect with",
            related,
            "Related concepts, without a required order",
          ],
        ].map(([label, items, description]) => (
          <div key={label}>
            <h4>{label}</h4>
            <p>{description}</p>
            <div className="km-chips">
              {items.length ? (
                items.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => onExplore?.(t.id)}
                  >
                    {t.title}
                    <ArrowRight size={12} />
                  </button>
                ))
              ) : (
                <span className="km-empty">
                  {label === "Build on"
                    ? "A starting point: no listed prerequisites."
                    : "No connections recorded yet."}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function KnowledgeMap({
  topics = [],
  questions = [],
  initialTopicId,
  onOpenTopic,
}) {
  const [focus, setFocus] = useState(initialTopicId || null);
  const [domain, setDomain] = useState(null);
  const [trail, setTrail] = useState(initialTopicId ? [initialTopicId] : []);
  const [query, setQuery] = useState("");
  const [pathId, setPathId] = useState("language");
  const marker = `km-arrow-${useId().replace(/:/g, "")}`;
  const index = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const neighbors = useMemo(() => neighborhood(topics, focus), [topics, focus]);
  const { current, prerequisites, usedBy, related } = neighbors;
  const path = PATHS.find((p) => p.id === pathId) || PATHS[0];
  const pathTopics = path.ids.map((id) => index.get(id)).filter(Boolean);
  const searchResults = query.trim()
    ? topics.filter((t) =>
        `${t.title} ${(t.subtopics || []).join(" ")} ${t.id}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : [];
  useEffect(() => {
    setFocus(initialTopicId || null);
    setTrail(initialTopicId ? [initialTopicId] : []);
    setDomain(null);
  }, [initialTopicId]);
  function explore(id) {
    if (!index.has(id)) return;
    setFocus(id);
    setDomain(null);
    setQuery("");
    setTrail((old) => (old.at(-1) === id ? old : [...old, id].slice(-20)));
  }
  function reset() {
    setFocus(null);
    setDomain(null);
    setTrail([]);
    setQuery("");
  }
  function back() {
    if (trail.length <= 1) return reset();
    const next = trail.slice(0, -1);
    setTrail(next);
    setFocus(next.at(-1));
    setDomain(null);
  }
  function revisit(position) {
    const next = trail.slice(0, position + 1);
    setTrail(next);
    setFocus(next.at(-1));
    setDomain(null);
  }
  const selectedDomain = DOMAINS.find((d) => d.id === domain);
  const detailTopics = topics.filter((t) => t.category === domain);
  const questionCount = current
    ? questions.filter((q) => (q.topics || []).includes(current.id)).length
    : 0;
  const rowHeight = 105;
  const chartHeight = Math.max(
    310,
    Math.max(prerequisites.length, usedBy.length, 1) * rowHeight + 85,
  );
  const centerY = chartHeight / 2;
  function nodeY(i, count) {
    return centerY + (i - (count - 1) / 2) * rowHeight;
  }
  return (
    <div className="km-root">
      <header className="km-header">
        <span className="km-eyebrow">CONNECTED KNOWLEDGE</span>
        <h1>See how the ideas fit together.</h1>
        <p>
          Start with the landscape. Follow a concept from its foundations to
          what it makes possible.
        </p>
      </header>
      <div className="km-toolbar">
        <div className="km-view-controls">
          <button
            type="button"
            className="km-action"
            onClick={back}
            disabled={!focus && !domain}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button type="button" className="km-action" onClick={reset}>
            <RotateCcw size={15} /> Overview
          </button>
        </div>
        <label className="km-search">
          <Search size={17} />
          <span className="km-sr">Find a concept</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a concept, e.g. attention"
            type="search"
          />
        </label>
      </div>
      {query.trim() && (
        <section
          className="km-search-results"
          aria-label="Concept search results"
        >
          <p role="status">{searchResults.length} matching concepts</p>
          <div className="km-chips">
            {searchResults.map((t) => (
              <button type="button" key={t.id} onClick={() => explore(t.id)}>
                {t.title}
                <ArrowRight size={13} />
              </button>
            ))}
          </div>
          {!searchResults.length && (
            <p>
              Try a broader term such as probability, training, or evaluation.
            </p>
          )}
        </section>
      )}
      {trail.length > 0 && (
        <nav className="km-trail" aria-label="Exploration trail">
          <span>Your trail</span>
          {trail.map((id, i) => (
            <React.Fragment key={`${id}-${i}`}>
              <ArrowRight size={12} aria-hidden="true" />
              <button
                type="button"
                onClick={() => revisit(i)}
                aria-current={i === trail.length - 1 ? "location" : undefined}
              >
                {index.get(id)?.title || id}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="km-workspace">
        <section
          className="km-chart-panel"
          aria-label={
            current
              ? `Connections for ${current.title}`
              : "Nine-domain curriculum overview"
          }
        >
          <div className="km-panel-title">
            <div>
              <span className="km-eyebrow">
                {current ? "CONCEPT NEIGHBORHOOD" : "THE LANDSCAPE"}
              </span>
              <h2>{current ? current.title : "One connected curriculum"}</h2>
            </div>
            <span className="km-count">
              {current
                ? `${prerequisites.length + usedBy.length + related.length} connections`
                : `${topics.length} concepts · 9 domains`}
            </span>
          </div>
          <p className="km-chart-help">
            {current
              ? "Read left to right: what you build on → this concept → what it unlocks. Select any node to keep exploring."
              : "Select a domain to see its concepts. Lines show broad connections, not a required study sequence."}
          </p>
          <div className="km-scroll">
            <div
              className={`km-map ${current ? "km-map-focus" : "km-map-overview"}`}
              style={{ height: current ? chartHeight : 470 }}
            >
              {!current ? (
                <>
                  <svg
                    viewBox="0 0 1000 470"
                    preserveAspectRatio="none"
                    className="km-edges"
                    aria-hidden="true"
                  >
                    {DOMAIN_LINKS.map(([a, b]) => (
                      <line
                        key={`${a}-${b}`}
                        x1={DOMAINS[a].x * 10}
                        y1={DOMAINS[a].y * 4.7}
                        x2={DOMAINS[b].x * 10}
                        y2={DOMAINS[b].y * 4.7}
                        className={
                          domain &&
                          [DOMAINS[a].id, DOMAINS[b].id].includes(domain)
                            ? "km-edge-active"
                            : ""
                        }
                      />
                    ))}
                  </svg>
                  {DOMAINS.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`km-node km-domain-node ${domain === d.id ? "km-node-current" : ""}`}
                      style={{ left: `${d.x}%`, top: `${d.y}%` }}
                      onClick={() => setDomain(d.id)}
                      aria-pressed={domain === d.id}
                    >
                      <span className="km-node-kind">
                        {topics.filter((t) => t.category === d.id).length}{" "}
                        concepts
                      </span>
                      <strong>{d.title}</strong>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <span className="km-lane-label" style={{ left: "16%" }}>
                    BUILD ON
                  </span>
                  <span className="km-lane-label" style={{ left: "50%" }}>
                    YOU ARE HERE
                  </span>
                  <span className="km-lane-label" style={{ left: "84%" }}>
                    UNLOCKS
                  </span>
                  <svg
                    viewBox={`0 0 1000 ${chartHeight}`}
                    preserveAspectRatio="none"
                    className="km-edges"
                    aria-hidden="true"
                  >
                    <defs>
                      <marker
                        id={marker}
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7f9c87" />
                      </marker>
                    </defs>
                    {prerequisites.map((t, i) => (
                      <path
                        key={t.id}
                        d={`M 290 ${nodeY(i, prerequisites.length)} C 345 ${nodeY(i, prerequisites.length)},345 ${centerY},365 ${centerY}`}
                        markerEnd={`url(#${marker})`}
                      />
                    ))}
                    {usedBy.map((t, i) => (
                      <path
                        key={t.id}
                        d={`M 635 ${centerY} C 675 ${centerY},675 ${nodeY(i, usedBy.length)},710 ${nodeY(i, usedBy.length)}`}
                        markerEnd={`url(#${marker})`}
                      />
                    ))}
                  </svg>
                  {prerequisites.map((t, i) => (
                    <TopicButton
                      key={t.id}
                      topic={t}
                      onSelect={explore}
                      className={path.ids.includes(t.id) ? "km-on-path" : ""}
                      style={{
                        left: "16%",
                        top: nodeY(i, prerequisites.length),
                      }}
                    />
                  ))}
                  <div
                    className="km-node km-node-current km-center"
                    style={{ left: "50%", top: centerY }}
                  >
                    <span className="km-node-kind">Selected concept</span>
                    <strong>{current.title}</strong>
                    <button
                      type="button"
                      className="km-node-open"
                      onClick={() => onOpenTopic?.(current.id)}
                    >
                      Open lesson <ArrowRight size={13} />
                    </button>
                  </div>
                  {usedBy.map((t, i) => (
                    <TopicButton
                      key={t.id}
                      topic={t}
                      onSelect={explore}
                      className={path.ids.includes(t.id) ? "km-on-path" : ""}
                      style={{ left: "84%", top: nodeY(i, usedBy.length) }}
                    />
                  ))}
                  {!prerequisites.length && (
                    <p
                      className="km-lane-empty"
                      style={{ left: "16%", top: centerY }}
                    >
                      A starting point.
                      <br />
                      No listed prerequisites.
                    </p>
                  )}
                  {!usedBy.length && (
                    <p
                      className="km-lane-empty"
                      style={{ left: "84%", top: centerY }}
                    >
                      No dependent concepts
                      <br />
                      recorded yet.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          {current && (
            <div className="km-related">
              <span className="km-eyebrow">RELATED · EXPLORE SIDEWAYS</span>
              <div className="km-chips">
                {related.length ? (
                  related.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => explore(t.id)}
                      className={path.ids.includes(t.id) ? "km-on-path" : ""}
                    >
                      {t.title}
                      <ArrowRight size={12} />
                    </button>
                  ))
                ) : (
                  <span className="km-empty">
                    No additional related concepts recorded.
                  </span>
                )}
              </div>
            </div>
          )}
          <Legend overview={!current} />
        </section>
        <aside
          className="km-detail"
          aria-label="Selected concept details"
          aria-live="polite"
        >
          {current ? (
            <>
              <span className="km-eyebrow">
                {DOMAINS.find((x) => x.id === current.category)?.title}
              </span>
              <h2>{current.title}</h2>
              <p>{current.summary}</p>
              <div className="km-detail-stats">
                <span>
                  <b>{questionCount}</b> practice questions
                </span>
                <span>
                  <b>{prerequisites.length}</b> prerequisites
                </span>
              </div>
              <button
                type="button"
                className="km-primary"
                onClick={() => onOpenTopic?.(current.id)}
              >
                <BookOpen size={16} /> Study this concept{" "}
                <ArrowRight size={15} />
              </button>
              <div className="km-reading-tip">
                <h3>Make the connection</h3>
                <p>
                  Before opening your notes, explain why this concept depends on
                  its foundations. Then name one problem it helps you solve.
                </p>
              </div>
              {path.ids.includes(current.id) && (
                <p className="km-path-note">
                  This concept is on your selected learning path below.
                </p>
              )}
            </>
          ) : selectedDomain ? (
            <>
              <span className="km-eyebrow">DOMAIN SELECTED</span>
              <h2>{selectedDomain.title}</h2>
              <p>{selectedDomain.note}</p>
              <div className="km-topic-list">
                {detailTopics.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => explore(t.id)}
                  >
                    <span>{t.title}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Layers size={26} strokeWidth={1.4} />
              <h2>From the whole to the parts</h2>
              <p>
                The same idea can appear in a derivation, an implementation, a
                system constraint, and a research question.
              </p>
              <ol>
                <li>Select a domain to find a concept.</li>
                <li>Follow prerequisites and dependent concepts.</li>
                <li>Open the lesson when you are ready to practice.</li>
              </ol>
              <div className="km-reading-tip">
                <h3>Try a connected path</h3>
                <p>
                  How does probability lead to attention? Explore the guided
                  route below, one step at a time.
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
      <section className="km-paths" aria-label="Curated learning paths">
        <div className="km-path-heading">
          <div>
            <span className="km-eyebrow">FOLLOW AN IDEA</span>
            <h2>Guided learning paths</h2>
          </div>
          <label>
            Choose a route
            <select value={pathId} onChange={(e) => setPathId(e.target.value)}>
              {PATHS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p>
          {path.note} These routes are editorial study sequences; they do not
          replace each lesson’s prerequisites.
        </p>
        <ol className="km-path-steps">
          {pathTopics.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => explore(t.id)}
                className={focus === t.id ? "km-step-selected" : ""}
                aria-current={focus === t.id ? "step" : undefined}
              >
                <span>{i + 1}</span>
                {t.title}
              </button>
              {i < pathTopics.length - 1 && (
                <ArrowRight size={15} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
