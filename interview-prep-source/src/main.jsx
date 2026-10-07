import React, {
  useEffect,
  useState,
  useMemo,
  useContext,
  createContext,
  useRef,
} from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Building2,
  Play,
  Mic,
  RotateCcw,
  ChartNoAxesCombined,
  Compass,
  ArrowUpRight,
  ArrowRight,
  Search,
  ChevronRight,
  Check,
  Clock,
  Target,
  Plus,
  Settings,
  Download,
  Upload,
  Bookmark,
  Menu,
  X,
  CheckCircle2,
  ExternalLink,
  Code2,
  Brain,
  FlaskConical,
  GraduationCap,
  Calendar,
  Sun,
  Command,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Pause,
  Volume2,
} from "lucide-react";
import {
  categories,
  typeNames,
  defaultState,
  schedule,
  effectiveMastery,
  topicMastery,
  categoryMastery,
  generatePlan,
  rankQuestions,
  validateImport,
  isoDay,
  DAY,
} from "./engine";
import { Diagram } from "./Diagrams";
import { ConceptDiagram } from "./ConceptDiagram";
import { RichText, FormulaGuide } from "./MathText";
import { PageOutline } from "./PageOutline";
import { DashboardMap } from "./DashboardMap";
import { KnowledgeMap, ConceptConnections } from "./KnowledgeMap";
import "./style.css";
import "./theme.css";
const C = createContext();
const useApp = () => useContext(C);
const KEY = "research-practice:v1";
const nav = [
  ["dashboard", "Dashboard", "Overview", LayoutDashboard],
  ["study", "Study", "Study", BookOpen],
  ["map", "Knowledge Map", "Explore connections", Compass],
  ["questions", "Questions", "Question explorer", Layers],
  ["companies", "Companies", "Companies and roles", Building2],
  ["practice", "Practice", "Daily practice", Play],
  ["mock", "Mock Interview", "Mock interview", Mic],
  ["review", "Review", "Spaced review", RotateCcw],
  ["progress", "Progress", "Mastery and progress", ChartNoAxesCombined],
  ["guide", "Study Guide", "How to study", Compass],
];
const formatDate = (n) =>
  new Date(n).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const cx = (...s) => s.filter(Boolean).join(" ");
function Icon({ name, size = 18, ...p }) {
  const I =
    {
      math: GraduationCap,
      ml: Brain,
      dl: Layers,
      llm: Command,
      dsa: Code2,
      mlcoding: Code2,
      systems: Layers,
      research: FlaskConical,
      domain: Compass,
    }[name] || BookOpen;
  return <I size={size} {...p} />;
}
function Link({ to, children, className = "", ...p }) {
  return (
    <a href={"#/" + to} className={className} {...p}>
      {children}
    </a>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
  small = false,
  ...props
}) {
  return (
    <button
      className={cx("button", secondary && "secondary", small && "small")}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
function Badge({ children, tone = "" }) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Bar({ value }) {
  return (
    <div
      className="bar"
      role="meter"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Mastery"
    >
      <span style={{ width: value + "%" }} />
    </div>
  );
}
function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <CheckCircle2 size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function PageHead({ eyebrow, title, description, action }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Sources({ items = [] }) {
  return (
    <ul className="sources">
      {items.map((s, i) => (
        <li key={i}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.title || s.url}
            <ExternalLink size={13} />
          </a>
          {s.evidence && (
            <Badge tone={s.evidence === "OFFICIAL" ? "green" : "amber"}>
              {s.evidence}
            </Badge>
          )}
          {s.lastVerified && <small>Verified {s.lastVerified}</small>}
          {s.summary && <p>{s.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
function TopicLinks({ ids = [] }) {
  const { topics } = useApp();
  return (
    <div className="tags">
      {ids.map((id) => (
        <Link key={id} to={"study/" + id} className="tag">
          {topics.find((t) => t.id === id)?.title || id}
          <ArrowUpRight size={12} />
        </Link>
      ))}
    </div>
  );
}
function Stars({ n }) {
  return (
    <span className="stars" aria-label={`Importance ${n}/5`}>
      {"★".repeat(n)}
      <span>{"★".repeat(5 - n)}</span>
    </span>
  );
}
function useTimer(seconds = 60) {
  const [left, setLeft] = useState(seconds),
    [active, setActive] = useState(false);
  useEffect(() => {
    if (!active) return;
    const end = Date.now() + left * 1000;
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) setActive(false);
    }, 250);
    return () => clearInterval(t);
  }, [active]);
  return {
    left,
    active,
    toggle: () => setActive(!active),
    reset: (n) => {
      setLeft(n);
      setActive(false);
    },
  };
}
const timeText = (n) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
const planReason = (value) =>
  ({
    "\ubcf5\uc2b5 \uc608\uc815\uc77c \ub3c4\ub798": "Review is due",
    "\uc120\ud0dd\ud55c \ucde8\uc57d \uc601\uc5ed": "Selected weak area",
    "\uc544\uc9c1 \ud3c9\uac00\ud558\uc9c0 \uc54a\uc740 \uac1c\ub150":
      "Not assessed yet",
    "\uc9c1\ubb34 \uc911\uc694\ub3c4 \u00b7 \uc219\ub828\ub3c4 \ubc18\uc601":
      "Role priority and mastery",
  })[value] || value;
function loadState(data) {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    return {
      state: raw
        ? validateImport(
            JSON.parse(raw),
            data.questions.map((q) => q.id),
            data.topics.map((t) => t.id),
            data.companies.map((c) => c.id),
            data.roles.map((r) => r.id),
          )
        : defaultState(),
      recovery: null,
    };
  } catch {
    return { state: defaultState(), recovery: raw };
  }
}
function App({ data }) {
  const [initial] = useState(() => loadState(data));
  const [state, setState] = useState(initial.state),
    [recovery, setRecovery] = useState(initial.recovery);
  const [, setClockTick] = useState(0);
  const [route, setRoute] = useState(location.hash.slice(2) || "dashboard"),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState(""),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState("");
  useEffect(() => {
    const fn = () => {
      if (location.hash && !location.hash.startsWith("#/")) return;
      setRoute(location.hash.slice(2) || "dashboard");
      setMobile(false);
      setSearch("");
      window.scrollTo(0, 0);
      requestAnimationFrame(() =>
        document.getElementById("main-content")?.focus({ preventScroll: true }),
      );
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    if (recovery) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is unavailable. Download a backup from Progress to keep your work.",
      );
    }
  }, [state, recovery]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        setMobile(false);
        setSearch("");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setClockTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  const update = (fn) =>
    setState((old) => (typeof fn === "function" ? fn(old) : { ...old, ...fn }));
  const grade = (id, rating) => {
    update((s) => ({
      ...s,
      reviews: { ...s.reviews, [id]: schedule(s.reviews[id], rating) },
      history: [...s.history, { id, rating, at: Date.now() }],
    }));
    setToast("Rating saved. Your next review is scheduled.");
  };
  const [page, id] = route.split("/"),
    due = data.questions.filter(
      (q) => state.reviews[q.id]?.nextReview <= Date.now(),
    );
  const value = { ...data, state, update, grade, toast: setToast, route, due };
  const matched = search.trim()
    ? data.questions
        .filter((q) =>
          (q.title + " " + q.question)
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .slice(0, 5)
    : [];
  return (
    <C.Provider value={value}>
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside
        id="workspace-navigation"
        className={cx("sidebar", mobile && "open")}
      >
        <Link to="dashboard" className="brand">
          <span className="brand-symbol">
            r<span>∴</span>
          </span>
          <span>
            research<span>practice / interview prep</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Close menu"
        >
          <X />
        </button>
        <div className="nav-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map(([key, en, ko, I]) => (
            <Link
              key={key}
              to={key}
              aria-current={page.split("?")[0] === key ? "page" : undefined}
              className={cx("nav-item", page.split("?")[0] === key && "active")}
            >
              <I size={18} />
              <span>
                {en}
                <small>{ko}</small>
              </span>
              {key === "review" && due.length > 0 && (
                <b className="nav-count">{due.length}</b>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-dot" /> LOCAL-FIRST LEARNING
          <p>
            Go deeper, at your own pace.
            <br />
            Your progress stays in this browser.
          </p>
          <Link to="settings" className="profile">
            <span className="avatar">JR</span>
            <span>
              My research journey<small>Goals and study settings</small>
            </span>
            <Settings size={16} />
          </Link>
          <a href="/" className="back-home">
            jrohsc.github.io <ArrowUpRight size={13} />
          </a>
        </div>
      </aside>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <span>Interview preparation</span>
            <ChevronRight size={14} />
            <strong>
              {nav.find((n) => n[0] === page.split("?")[0])?.[1] || "Workspace"}
            </strong>
          </div>
          <div className="search-wrap">
            <Search size={15} />
            <input
              id="global-search"
              placeholder="Search concepts or questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search everything"
            />
            <kbd>⌘ K</kbd>
            {search && (
              <div className="search-results">
                {matched.length ? (
                  matched.map((q) => (
                    <Link to={"questions/" + q.id} key={q.id}>
                      {q.title}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))
                ) : (
                  <p>No results found.</p>
                )}
                <Link to={"questions?search=" + encodeURIComponent(search)}>
                  Browse matching questions →
                </Link>
              </div>
            )}
          </div>
          <span className="header-date">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </header>
        {recovery && (
          <div className="notice danger" role="alert">
            <span>
              Your saved data could not be read, so automatic saving is paused.
              Download the original data before starting fresh.
            </span>
            <Button
              secondary
              small
              onClick={() =>
                downloadFile("research-practice-recovery.json", recovery)
              }
            >
              Download original data
            </Button>
            <Button
              secondary
              small
              onClick={() => {
                setRecovery(null);
                setState(defaultState());
              }}
            >
              Replace records and start fresh
            </Button>
          </div>
        )}
        {storageError && (
          <div className="notice danger" role="alert">
            {storageError}
          </div>
        )}
        <main id="main-content" tabIndex="-1">
          <div className="reading-layout">
            <PageOutline route={route} />
            <div className="page-content">
              {page === "map" ? (
                <KnowledgeMap
                  topics={data.topics}
                  questions={data.questions}
                  initialTopicId={id}
                  onOpenTopic={(topic) => (location.hash = "#/study/" + topic)}
                />
              ) : page === "dashboard" ? (
                <Dashboard />
              ) : page.startsWith("study") ? (
                id ? (
                  <TopicPage id={id} />
                ) : (
                  <Study />
                )
              ) : page.startsWith("questions") ? (
                id ? (
                  <QuestionPage key={id} id={id} />
                ) : (
                  <Questions
                    initialSearch={
                      page.includes("?search=")
                        ? decodeURIComponent(page.split("?search=")[1])
                        : ""
                    }
                  />
                )
              ) : page === "companies" ? (
                id ? (
                  <CompanyPage id={id} />
                ) : (
                  <Companies />
                )
              ) : page === "compare" ? (
                <Compare />
              ) : page === "practice" ? (
                <Practice />
              ) : page === "mock" ? (
                <Mock />
              ) : page === "review" ? (
                <Review />
              ) : page === "progress" ? (
                <Progress />
              ) : page === "guide" ? (
                <Guide />
              ) : page === "settings" ? (
                <SettingsPage />
              ) : (
                <Empty
                  title="Page not found"
                  action={
                    <Link className="button" to="dashboard">
                      Back to dashboard
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </main>
        <footer className="footer">
          <span>
            RESEARCH PRACTICE <span className="dot-sep">/</span> Understanding
            over memorization.
          </span>
          <Link to="guide">
            Study principles <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </C.Provider>
  );
}
function Dashboard() {
  const { state, questions, topics, companies, roles, profiles, due } =
    useApp();
  const mistakeCounts = {};
  state.mistakes.forEach((m) =>
    questions
      .find((q) => q.id === m.questionId)
      ?.topics.forEach((id) => {
        mistakeCounts[id] = (mistakeCounts[id] || 0) + 1;
      }),
  );
  const today = isoDay(),
    done = state.history.filter((h) => isoDay(h.at) === today).length;
  const plan = useMemo(
    () => generatePlan(questions, topics, profiles, state),
    [questions, topics, profiles, state],
  );
  const completed = Object.keys(state.reviews).length,
    avg = Math.round(
      questions.reduce((s, q) => s + effectiveMastery(state.reviews[q.id]), 0) /
        questions.length,
    );
  const weak = Object.keys(categories)
    .slice(0, 8)
    .map((cat) => ({
      cat,
      mastery: categoryMastery(cat, topics, questions, state.reviews),
    }))
    .sort((a, b) => a.mastery - b.mastery);
  const target = companies.filter((c) =>
    state.settings.companies.includes(c.id),
  );
  return (
    <>
      <PageHead
        eyebrow="YOUR RESEARCH JOURNEY"
        title="Your knowledge, connected."
        action={
          <Link to="settings" className="button secondary small">
            <Settings size={15} /> Study goals
          </Link>
        }
      />
      <DashboardMap
        topics={topics}
        questions={questions}
        reviews={state.reviews}
        renderCompanies={(topic) => <CompanyLabels topic={topic} compact />}
        practice={
          <section className="atlas-practice" aria-label="Today’s practice">
            <h3>Today's practice</h3>
            <p>
              {state.settings.minutes} min · {plan.items.length} questions
            </p>
            {due.length > 0 && (
              <Link className="atlas-review-link" to="review">
                {due.length} reviews due
              </Link>
            )}
            <Link to="practice" className="button small">
              Start practice <ArrowRight size={14} />
            </Link>
          </section>
        }
      />
      <div className="stats-grid">
        {[
          [
            RotateCcw,
            "Reviews due",
            due.length,
            "Questions ready for spaced review",
            "review",
          ],
          [
            CheckCircle2,
            "Today's recall",
            done,
            "Attempts checked and self-assessed",
            "progress",
          ],
          [
            BookOpen,
            "Questions assessed",
            `${completed} / ${questions.length}`,
            "Questions attempted, not pages viewed",
            "questions",
          ],
          [
            ChartNoAxesCombined,
            "Overall mastery",
            avg + "%",
            "Includes unseen questions · Self-assessed",
            "progress",
          ],
        ].map(([I, label, n, desc, to]) => (
          <Link to={to} className="stat" key={label}>
            <span className="stat-label">
              <I size={15} />
              {label}
              <ArrowUpRight size={14} />
            </span>
            <strong>{n}</strong>
          </Link>
        ))}
      </div>
      <details className="dashboard-more">
        <summary>Progress & study resources</summary>
        <div className="dashboard-grid">
          <div className="right-stack">
            <section className="panel">
              <div className="section-head">
                <div>
                  <span className="eyebrow">KNOW YOUR GAPS</span>
                  <h2>Readiness by area</h2>
                </div>
                <Link to="progress" aria-label="View progress details">
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              {weak.slice(0, 5).map(({ cat, mastery }) => (
                <Link
                  to={"study?category=" + cat}
                  className="mastery-row"
                  key={cat}
                >
                  <div>
                    <span>{categories[cat]}</span>
                    <strong>{mastery}%</strong>
                  </div>
                  <Bar value={mastery} />
                </Link>
              ))}
              <small className="muted">
                Unassessed questions count as 0%. This is not a hiring
                prediction.
              </small>
            </section>
            <section className="quote-card">
              <span className="eyebrow">THE PRACTICE PRINCIPLE</span>
              <h3>
                “Recognizing an answer
                <br />
                is not the same as explaining it.”
              </h3>
              <p>
                Close your notes and explain it for 60 seconds.
                <br />
                Where you get stuck is where to start next.
              </p>
              <Link to="guide">
                How to study effectively <ArrowUpRight size={15} />
              </Link>
            </section>
          </div>
        </div>
        <section className="section-spaced">
          <div className="section-head">
            <div>
              <span className="eyebrow">CONNECTED KNOWLEDGE</span>
              <h2>From foundations to research</h2>
              <Link to="map" className="map-entry-link">
                <Compass size={14} /> Follow the concept map
              </Link>
            </div>
            <Link to="study">
              Full curriculum <ArrowRight size={15} />
            </Link>
          </div>
          <div className="track-grid">
            {["math", "mlcoding", "llm", "research"].map((cat) => (
              <Link
                to={"study?category=" + cat}
                className="track-card"
                key={cat}
              >
                <span className={"track-icon cat-" + cat}>
                  <Icon name={cat} size={23} />
                </span>
                <h3>{categories[cat]}</h3>
                <p>
                  {
                    {
                      math: "From intuition to equations. The language behind the models.",
                      mlcoding:
                        "Turn theory into code, from numerical stability to debugging.",
                      llm: "Connect attention, training, evaluation, and alignment.",
                      research:
                        "Sharper hypotheses. More convincing experiments.",
                    }[cat]
                  }
                </p>
                <span>
                  {topics.filter((t) => t.category === cat).length} topics{" "}
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        {state.mistakes.length > 0 && (
          <section className="panel section-spaced">
            <div className="section-head">
              <h2>Learn from your mistakes</h2>
              <Link to="review">
                Mistake notebook <ArrowRight size={15} />
              </Link>
            </div>
            <div className="tags">
              {Object.entries(mistakeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([id, count]) => (
                  <Link key={id} className="tag" to={"study/" + id}>
                    {topics.find((t) => t.id === id)?.title} · {count} mistakes
                  </Link>
                ))}
            </div>
            {state.mistakes
              .slice(-3)
              .reverse()
              .map((m) => (
                <Link
                  className="simple-row"
                  key={m.id}
                  to={"questions/" + m.questionId}
                >
                  <span>
                    {questions.find((q) => q.id === m.questionId)?.title}
                  </span>
                  <span className="muted">{m.principle}</span>
                </Link>
              ))}
          </section>
        )}
      </details>
    </>
  );
}
function QuestionRow({ q }) {
  const { state } = useApp();
  return (
    <Link to={"questions/" + q.id} className="question-row">
      <span className="q-icon">
        <Icon
          name={
            q.type === "implementation"
              ? "mlcoding"
              : q.type === "research"
                ? "research"
                : "ml"
          }
        />
      </span>
      <div className="question-row-main">
        <h3>{q.title}</h3>
        <div className="tags">
          <small>{typeNames[q.type] || q.type}</small>
          <span>·</span>
          <small>Difficulty {q.difficulty}/5</small>
          <span>·</span>
          <small>{q.expectedTime} min</small>
        </div>
      </div>
      {state.bookmarks.includes(q.id) && (
        <Bookmark size={15} fill="currentColor" />
      )}
      {state.reviews[q.id] && (
        <Badge tone="green">{effectiveMastery(state.reviews[q.id])}%</Badge>
      )}
      <ChevronRight size={17} />
    </Link>
  );
}
function Questions({ initialSearch = "" }) {
  const { questions, topics, companies, roles, state } = useApp();
  const [search, setSearch] = useState(initialSearch),
    [cat, setCat] = useState("all"),
    [company, setCompany] = useState("all"),
    [role, setRole] = useState("all"),
    [type, setType] = useState("all"),
    [diff, setDiff] = useState("all"),
    [book, setBook] = useState(false),
    [limit, setLimit] = useState(30);
  useEffect(() => setSearch(initialSearch), [initialSearch]);
  const filtered = questions.filter(
    (q) =>
      (q.title + " " + q.question + " " + q.subtopics.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (cat === "all" ||
        q.topics.some(
          (id) => topics.find((t) => t.id === id)?.category === cat,
        )) &&
      (company === "all" || q.companies.includes(company)) &&
      (role === "all" || q.roles.includes(role)) &&
      (type === "all" || q.type === type) &&
      (diff === "all" || q.difficulty === Number(diff)) &&
      (!book || state.bookmarks.includes(q.id)),
  );
  return (
    <>
      <PageHead
        eyebrow="RETRIEVE · REASON · IMPLEMENT"
        title="Question explorer"
        description="Think first, then check. Every question is an original practice exercise."
      />
      <div className="panel filters" data-section="Search and filters">
        <label className="field search-field">
          Search questions
          <div>
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="softmax, Bayes, ablation…"
            />
          </div>
        </label>
        <div className="filter-row">
          <Select
            label="Area"
            value={cat}
            onChange={setCat}
            options={[["all", "All areas"], ...Object.entries(categories)]}
          />
          <Select
            label="Company relevance"
            value={company}
            onChange={setCompany}
            options={[
              ["all", "All companies"],
              ...companies.map((c) => [c.id, c.short]),
            ]}
          />
          <Select
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              ["all", "All roles"],
              ...roles.map((r) => [r.id, r.name]),
            ]}
          />
          <Select
            label="Type"
            value={type}
            onChange={setType}
            options={[["all", "All types"], ...Object.entries(typeNames)]}
          />
          <Select
            label="Difficulty"
            value={diff}
            onChange={setDiff}
            options={[
              ["all", "All difficulties"],
              ...[1, 2, 3, 4, 5].map((n) => [n, `${n} / 5`]),
            ]}
          />
        </div>
      </div>
      <div className="results-head">
        <span>
          <strong>{filtered.length}</strong> questions
        </span>
        <label className="check-label">
          <input
            type="checkbox"
            checked={book}
            onChange={(e) => setBook(e.target.checked)}
          />
          <Bookmark size={15} /> Bookmarked only
        </label>
      </div>
      <div className="panel question-list" data-section="Practice questions">
        {filtered.slice(0, limit).map((q) => (
          <QuestionRow q={q} key={q.id} />
        ))}
        {!filtered.length && (
          <Empty title="No questions match your filters">
            Try a different search term or adjust your filters.
          </Empty>
        )}
      </div>
      {filtered.length > limit && (
        <Button secondary onClick={() => setLimit(limit + 30)}>
          Show 30 more
        </Button>
      )}
    </>
  );
}
function Select({ label, value, onChange, options, ...p }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} {...p}>
        {options.map(([id, name]) => (
          <option value={id} key={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
function QuestionPage({ id }) {
  const { questions } = useApp();
  const q = questions.find((q) => q.id === id);
  return q ? (
    <>
      <Link to="questions" className="back-link">
        ← Question explorer
      </Link>
      <QuestionCard q={q} />
    </>
  ) : (
    <Empty title="Question not found" />
  );
}
function QuestionCard({
  q,
  mock = false,
  onConfidence,
  confidence,
  allowHint = true,
}) {
  const { state, update, grade, companies, topics } = useApp();
  const [revealed, setRevealed] = useState(false),
    [hints, setHints] = useState(0),
    [attempt, setAttempt] = useState(state.drafts[q.id] || ""),
    [rated, setRated] = useState(false),
    [notebook, setNotebook] = useState(false),
    [rubric, setRubric] = useState([]),
    [mode, setMode] = useState(60);
  const timer = useTimer(60);
  const input = useRef();
  const saveDraft = (v) => {
    setAttempt(v);
    update((s) => ({ ...s, drafts: { ...s.drafts, [q.id]: v } }));
  };
  return (
    <article className="question-detail">
      <div className="question-topline">
        <div className="tags">
          <Badge>{typeNames[q.type] || q.type}</Badge>
          <Badge tone="amber">Difficulty {q.difficulty} / 5</Badge>
          <span className="muted">
            <Clock size={14} /> {q.expectedTime} min
          </span>
        </div>
        <button
          className={cx(
            "icon-button",
            state.bookmarks.includes(q.id) && "selected",
          )}
          aria-label="Bookmark question"
          aria-pressed={state.bookmarks.includes(q.id)}
          onClick={() =>
            update((s) => ({
              ...s,
              bookmarks: s.bookmarks.includes(q.id)
                ? s.bookmarks.filter((x) => x !== q.id)
                : [...s.bookmarks, q.id],
            }))
          }
        >
          <Bookmark size={19} />
        </button>
      </div>
      <h1>{q.title}</h1>
      <div className="question-prompt">
        <RichText>{q.question}</RichText>
      </div>
      <div className="recall-prompt">
        <Brain size={18} />
        <span>
          Close your notes and explain it in your own words. Write the equation
          or code before checking.
        </span>
      </div>
      <TopicLinks ids={q.topics} />
      <div className="answer-workspace">
        <div className="section-head">
          <label htmlFor={"draft-" + q.id}>Your answer / working</label>
          <span className="autosave">Autosaved in this browser</span>
        </div>
        <textarea
          id={"draft-" + q.id}
          ref={input}
          rows={7}
          value={attempt}
          onChange={(e) => saveDraft(e.target.value)}
          placeholder="Assumptions → Core principle → Equations or code → Validation → Trade-offs"
          spellCheck={false}
        />
      </div>
      <div className="question-controls">
        <Button secondary onClick={() => input.current?.focus()}>
          <Brain size={16} /> Think
        </Button>
        {allowHint &&
          q.hints.slice(0, 2).map((h, i) => (
            <Button
              key={i}
              small
              secondary
              disabled={hints > i}
              onClick={() => setHints(i + 1)}
            >
              Hint {i + 1}
            </Button>
          ))}
        {!mock && (
          <Button onClick={() => setRevealed(!revealed)}>
            {revealed ? "Hide solution" : "Show Solution"}{" "}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
      {hints > 0 && (
        <div className="hint-box">
          {q.hints.slice(0, hints).map((h, i) => (
            <p key={i}>
              <strong>Hint {i + 1}.</strong> <RichText>{h}</RichText>
            </p>
          ))}
        </div>
      )}
      {!mock && (
        <div className="verbal-bar">
          <Volume2 size={18} />
          <Select
            label="Explain aloud"
            value={mode}
            onChange={(v) => {
              setMode(Number(v));
              timer.reset(Number(v));
            }}
            options={[
              [30, "30-second summary"],
              [60, "60-second interview answer"],
              [180, "3-minute deep explanation"],
            ]}
          />
          <span className="timer">{timeText(timer.left)}</span>
          <button
            className="icon-button"
            aria-label={
              timer.active
                ? "Pause explanation timer"
                : "Start explanation timer"
            }
            onClick={timer.toggle}
          >
            {timer.active ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            onClick={() => timer.reset(mode)}
            aria-label="Reset timer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
      {mock && (
        <Select
          label="Confidence in this answer"
          value={confidence || ""}
          onChange={onConfidence}
          options={[
            ["", "Choose an option"],
            ["1", "1 — Not sure"],
            ["2", "2 — Can explain part of it"],
            ["3", "3 — Mostly confident"],
            ["4", "4 — Can explain the reasoning"],
          ]}
        />
      )}
      {revealed && !mock && (
        <div className="solution">
          <div className="solution-lead">
            <span className="eyebrow">SHORT INTERVIEW ANSWER</span>
            <h2>A concise interview answer</h2>
            <p>
              <RichText>{q.shortAnswer}</RichText>
            </p>
          </div>
          <Details title="Intuition and explanation" open>
            <p>
              <RichText>{q.intuition}</RichText>
            </p>
          </Details>
          <Details title="Derivation and reasoning">
            <div className="math-text">
              <RichText>{q.derivation}</RichText>
            </div>
            <FormulaGuide
              formulas={
                topics.find((t) => q.topics.includes(t.id))?.formulas || []
              }
            />
          </Details>
          {q.implementation && (
            <Details title="Implementation">
              <Code value={q.implementation} />
            </Details>
          )}
          <Details title="Common mistakes">
            <ul>
              {q.commonMistakes.map((x, i) => (
                <li key={i}>
                  <RichText>{x}</RichText>
                </li>
              ))}
            </ul>
          </Details>
          <Details title="Follow-up questions">
            <ul>
              {q.followUps.map((x, i) => (
                <li key={i}>
                  <RichText>{x}</RichText>
                </li>
              ))}
            </ul>
          </Details>
          <Details title="Related topics and prerequisites">
            <TopicLinks ids={[...new Set([...q.topics, ...q.prerequisites])]} />
          </Details>
          <Details title="Company relevance and sources">
            <p className="muted">
              This original exercise is relevant to preparation for the
              companies below. It is not a reported interview question.
            </p>
            <div className="tags">
              {q.companies.map((id) => (
                <Link className="tag" to={"companies/" + id} key={id}>
                  {companies.find((c) => c.id === id)?.short || id}
                </Link>
              ))}
            </div>
            <Sources items={q.sources} />
          </Details>
          <div className="self-check">
            <h3>Answer checkpoints</h3>
            <p>
              Compare these checkpoints with your answer. This is
              self-assessment, not automatic grading.
            </p>
            {q.rubric?.map((r, i) => (
              <label className="check-label" key={i}>
                <input
                  type="checkbox"
                  checked={rubric.includes(i)}
                  onChange={() =>
                    setRubric((x) =>
                      x.includes(i) ? x.filter((n) => n !== i) : [...x, i],
                    )
                  }
                />
                <RichText>{r}</RichText>
              </label>
            ))}
          </div>
          <div className="rating-box">
            <span className="eyebrow">HOW WELL DID YOU KNOW THIS?</span>
            <h3>
              {rated
                ? "Your rating has been saved."
                : "How well could you explain this without the solution?"}
            </h3>
            <div className="rating-buttons">
              {[
                ["again", "Again", "Relearn"],
                ["hard", "Hard", "Difficult"],
                ["good", "Good", "Recalled well"],
                ["easy", "Easy", "Explained easily"],
              ].map(([r, label, desc]) => (
                <button
                  disabled={rated}
                  key={r}
                  onClick={() => {
                    grade(q.id, r);
                    setRated(true);
                    if (r === "again") setNotebook(true);
                  }}
                >
                  <strong>{label}</strong>
                  <small>{desc}</small>
                  <span>
                    {r === "again"
                      ? "In 10 minutes"
                      : Math.round(schedule(state.reviews[q.id], r).interval) +
                        " days later"}
                  </span>
                </button>
              ))}
            </div>
            <Button secondary small onClick={() => setNotebook(!notebook)}>
              <Plus size={15} /> Add a mistake
            </Button>
          </div>
          {notebook && <MistakeForm q={q} onSave={() => setNotebook(false)} />}
        </div>
      )}
    </article>
  );
}
function Details({ title, children, open = false }) {
  return (
    <details className="details" open={open || undefined}>
      <summary>
        {title}
        <Plus size={16} />
      </summary>
      <div>{children}</div>
    </details>
  );
}
function Code({ value }) {
  const { toast } = useApp();
  return (
    <div className="code-block">
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast("Code copied.");
          } catch {
            toast("Select the code and copy it manually.");
          }
        }}
      >
        Copy
      </button>
      <pre>
        <code>{value}</code>
      </pre>
    </div>
  );
}
function MistakeForm({ q, onSave }) {
  const { update, toast } = useApp();
  const [form, setForm] = useState({
    thought: "",
    why: "",
    principle: "",
    signal: "",
  });
  return (
    <form
      className="mistake-form"
      onSubmit={(e) => {
        e.preventDefault();
        update((s) => ({
          ...s,
          mistakes: [
            ...s.mistakes,
            {
              ...form,
              id: crypto.randomUUID(),
              questionId: q.id,
              at: Date.now(),
            },
          ],
        }));
        toast("Mistake saved to your notebook.");
        onSave();
      }}
    >
      <h3>Turn a mistake into a cue for next time</h3>
      {[
        ["thought", "What I thought"],
        ["why", "Why it was wrong"],
        ["principle", "Correct principle"],
        ["signal", "How I will recognize it next time"],
      ].map(([key, label]) => (
        <label className="field" key={key}>
          {label}
          <textarea
            required
            rows={2}
            maxLength={5000}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}
      <Button type="submit">
        Save mistake <Check size={15} />
      </Button>
    </form>
  );
}
function Study() {
  const { topics, questions, state } = useApp();
  const [cat, setCat] = useState(
      new URLSearchParams(location.hash.split("?")[1] || "").get("category") ||
        "all",
    ),
    [search, setSearch] = useState("");
  const filtered = topics.filter(
    (t) =>
      (cat === "all" || t.category === cat) &&
      (t.title + " " + t.subtopics.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHead
        eyebrow="BUILD CONNECTED UNDERSTANDING"
        title="Build connected AI / ML knowledge"
        description="See the big picture, follow a connection, then understand the details."
        action={
          <Link to="map" className="button secondary">
            <Compass size={16} /> Knowledge map
          </Link>
        }
      />
      <div className="catalog-controls panel" data-section="Find a concept">
        <label className="search-field standalone">
          <Search size={17} />
          <input
            aria-label="Search topics"
            placeholder="Search concepts and subtopics…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>{filtered.length} topics</span>
        </label>
        <Select
          label="Curriculum area"
          value={cat}
          onChange={setCat}
          options={[["all", "All areas"], ...Object.entries(categories)]}
        />
      </div>
      <p className="catalog-evidence-key">
        <span className="company-label verified">
          <ShieldCheck size={12} /> Mentioned
        </span>{" "}
        Explicit official-source connection{" "}
        <span className="company-label inferred">
          <Compass size={12} /> Inferred
        </span>{" "}
        Role-based preparation relevance
      </p>
      {Object.entries(categories).map(([category, name]) => {
        const group = filtered.filter((t) => t.category === category);
        if (!group.length) return null;
        return (
          <section
            className="catalog-section"
            data-section={name}
            key={category}
          >
            <div className="section-head">
              <h2>
                <Icon name={category} size={21} /> {name}
              </h2>
              <span className="muted">{group.length} topics</span>
            </div>
            <div className="study-grid">
              {group.map((t) => {
                const mastery = topicMastery(t.id, questions, state.reviews);
                return (
                  <Link to={"study/" + t.id} className="topic-card" key={t.id}>
                    <div className="section-head">
                      <span className={"track-icon cat-" + t.category}>
                        <Icon name={t.category} />
                      </span>
                      <Badge>{categories[t.category]}</Badge>
                    </div>
                    <h3 className="topic-title">{t.title}</h3>
                    <p>{t.summary}</p>
                    <div className="topic-subtopics">
                      {t.subtopics.slice(0, 4).map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                      {t.subtopics.length > 4 && (
                        <span>+{t.subtopics.length - 4}</span>
                      )}
                    </div>
                    <CompanyLabels topic={t} compact />
                    <div className="topic-card-bottom">
                      <span>
                        {
                          questions.filter((q) => q.topics.includes(t.id))
                            .length
                        }{" "}
                        questions
                      </span>
                      <span>Mastery {mastery}%</span>
                    </div>
                    <Bar value={mastery} />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      {!filtered.length && (
        <Empty title="No results found">
          Try a different search term or curriculum area.
        </Empty>
      )}
    </>
  );
}
function CompanyLabels({ topic, compact = false }) {
  const { companies, profiles, roles, topicMentions = [], state } = useApp();
  const mentions = topicMentions.filter((m) => m.topicId === topic.id);
  const confirmed = [...new Set(mentions.map((m) => m.companyId))];
  const inferred = profiles
    .filter(
      (p) =>
        p.roleId === state.settings.role &&
        p.ratings.some(
          (r) => r.dimensionId === topic.category && r.importance >= 4,
        ),
    )
    .map((p) => p.companyId)
    .filter((id) => !confirmed.includes(id));
  const ids = compact
    ? [...confirmed, ...inferred].slice(0, 3)
    : [...confirmed, ...inferred];
  return (
    <div className="company-labels" aria-label="Company connections">
      {ids.map((id) => {
        const c = companies.find((c) => c.id === id),
          verified = confirmed.includes(id);
        return (
          <span
            key={id}
            className={"company-label " + (verified ? "verified" : "inferred")}
            data-evidence={verified ? "OFFICIAL" : "INFERRED"}
            title={
              verified
                ? "Mentioned in an official source; see scope and evidence in this lesson."
                : "Inferred relevance for your target role; not a verified mention."
            }
          >
            {verified ? <ShieldCheck size={12} /> : <Compass size={12} />}{" "}
            {c?.short || id}
            <small>{verified ? "Mentioned" : "Inferred"}</small>
          </span>
        );
      })}
      {compact && confirmed.length + inferred.length > 3 && (
        <span className="company-more">
          +{confirmed.length + inferred.length - 3}
        </span>
      )}
      {!ids.length && (
        <span className="muted">Company evidence not yet recorded</span>
      )}
    </div>
  );
}
function CompanyMentions({ topic }) {
  const { companies, profiles, roles, topicMentions = [], state } = useApp();
  const mentions = topicMentions.filter((m) => m.topicId === topic.id);
  const relevant = profiles.filter(
    (p) =>
      p.roleId === state.settings.role &&
      p.ratings.some(
        (r) => r.dimensionId === topic.category && r.importance >= 4,
      ),
  );
  const scopes = {
    INTERVIEW_GUIDE: "Interview guide",
    ROLE_DESCRIPTION: "Role description",
    RESEARCH_PUBLICATION: "Research publication",
  };
  return (
    <>
      <p className="muted">
        An explicit mention is a source-backed connection. A role requirement
        does not establish that a topic will be asked in an interview.
      </p>
      {mentions.length ? (
        <div className="mention-grid">
          {mentions.map((m, i) => (
            <article className="mention-card" key={i}>
              <div className="section-head">
                <h3>{companies.find((c) => c.id === m.companyId)?.name}</h3>
                <Badge tone="green">{m.evidence}</Badge>
              </div>
              <Badge>{scopes[m.scope] || m.scope}</Badge>
              <p>{m.summary}</p>
              <a href={m.url} target="_blank" rel="noreferrer">
                {m.sourceTitle} <ExternalLink size={13} />
              </a>
              <small>
                Verified {m.lastVerified} · Roles:{" "}
                {m.roles
                  ?.map(
                    (id) =>
                      roles.find((r) => r.id === id)?.title ||
                      roles.find((r) => r.id === id)?.name ||
                      id,
                  )
                  .join(", ")}
              </small>
              {m.verificationNote && (
                <p className="verification-note">{m.verificationNote}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="notice">
          No source-verified company mention has been recorded for this topic
          yet. The recommendations below are inferred, not reported interview
          evidence.
        </div>
      )}
      <h3>Inferred preparation relevance</h3>
      <p className="muted">
        Based on the selected role's learning priorities. Read the company
        profile for the rationale and confidence.
      </p>
      <div className="tags">
        {relevant.map((p) => {
          const c = companies.find((c) => c.id === p.companyId);
          return (
            <Link to={"companies/" + c.id} key={c.id} className="tag">
              {c.short}
              <Badge tone="amber">Inferred</Badge>
              <ArrowUpRight size={12} />
            </Link>
          );
        })}
      </div>
    </>
  );
}
function LessonSection({ title, eyebrow, children }) {
  return (
    <section className="panel lesson reader-section" data-section={title}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function TopicPage({ id }) {
  const { topics, questions, state } = useApp();
  const t = topics.find((t) => t.id === id);
  if (!t) return <Empty title="Topic not found" />;
  const qs = questions.filter((q) => q.topics.includes(id)),
    mastery = topicMastery(id, questions, state.reviews);
  const visual =
    t.visual ||
    {
      information: "entropy",
      distributions: "gaussian",
      regression: "regression",
      classification: "sigmoid",
      "ml-code-softmax": "softmax",
      "ml-code-linear": "regression",
      "linear-algebra": "pca",
      calculus: "gradient",
      expectation: "expectation",
    }[id];
  return (
    <>
      <Link className="back-link" to="study">
        ← Curriculum
      </Link>
      <PageHead
        eyebrow={categories[t.category]}
        title={t.title}
        description={t.summary}
        action={
          qs[0] && (
            <Link className="button" to={"questions/" + qs[0].id}>
              Recall practice <ArrowRight size={16} />
            </Link>
          )
        }
      />
      <CompanyLabels topic={t} />
      <div className="lesson-status">
        <span>
          {qs.filter((q) => state.reviews[q.id]).length} / {qs.length} questions
          assessed
        </span>
        <span>Mastery {mastery}%</span>
        <Bar value={mastery} />
      </div>
      <LessonSection
        title="Overview and intuition"
        eyebrow="START WITH THE IDEA"
      >
        <RichText as="p">{t.summary}</RichText>
        <h3>Build an intuition</h3>
        <RichText as="p">{t.intuition}</RichText>
        <h3>Why it matters in ML</h3>
        <RichText as="p">{t.application}</RichText>
        <div className="tags">
          {t.subtopics.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
      </LessonSection>
      <LessonSection title="Concept connections" eyebrow="FOLLOW THE THREAD">
        <p className="muted">
          See what this concept builds on and where it leads. Select a node to
          keep exploring the map.
        </p>
        <ConceptConnections
          topics={topics}
          topicId={id}
          onExplore={(next) => (location.hash = "#/map/" + next)}
        />
        <Link className="button secondary small" to={"map/" + id}>
          Explore the full knowledge map <ArrowUpRight size={14} />
        </Link>
      </LessonSection>
      <LessonSection
        title="Equations, explained"
        eyebrow="SYMBOL → MEANING → EXAMPLE"
      >
        {t.formulas?.length ? (
          <FormulaGuide formulas={t.formulas} />
        ) : (
          <RichText as="div" className="math-text">
            {t.math}
          </RichText>
        )}
      </LessonSection>
      <LessonSection
        title="Step-by-step derivation"
        eyebrow="UNDERSTAND EVERY STEP"
      >
        <RichText as="div" className="derivation-text">
          {t.derivation}
        </RichText>
        <div className="notice">
          After reading once, close your notes. Explain why each step holds and
          which assumptions it needs.
        </div>
      </LessonSection>
      {t.workedExample && (
        <LessonSection title="Worked example" eyebrow="FOLLOW THE NUMBERS">
          <RichText as="div" className="worked-example">
            {t.workedExample}
          </RichText>
        </LessonSection>
      )}
      <LessonSection title="Visual explanation" eyebrow="SEE THE RELATIONSHIP">
        {t.visualSteps?.length ? (
          <ConceptDiagram key={id} steps={t.visualSteps} title={t.title} />
        ) : visual ? (
          <Diagram key={id} kind={visual} />
        ) : (
          <>
            <div className="concept-flow">
              {[
                "Inputs and assumptions",
                t.title,
                "Prediction or decision",
                "Evaluate and refine",
              ].map((x, i) => (
                <React.Fragment key={i}>
                  <div>{x}</div>
                  {i < 3 && <ArrowRight size={16} />}
                </React.Fragment>
              ))}
            </div>
            <RichText as="p">{t.application}</RichText>
            <p className="muted">
              A conceptual relationship diagram, not a quantitative simulation.
            </p>
          </>
        )}
      </LessonSection>
      <LessonSection
        title="Implementation and debugging"
        eyebrow="CONNECT THE MATH TO CODE"
      >
        {t.code && <Code value={t.code} />}
        <p>
          Check shapes, edge cases, and numerical stability. Compare your output
          against the hand-worked example above.
        </p>
        {t.debugging && (
          <div className="debug-challenge">
            <span className="eyebrow">PREDICT BEFORE REVEALING</span>
            <RichText as="p">{t.debugging.prompt}</RichText>
            <Details title="Reveal the cause and fix">
              <RichText as="p">{t.debugging.answer}</RichText>
            </Details>
          </div>
        )}
        <p className="muted">
          Copy these NumPy / PyTorch examples into your local environment to run
          them. Python does not execute in this static site.
        </p>
      </LessonSection>
      <LessonSection
        title="Independent practice"
        eyebrow="RETRIEVE BEFORE RECOGNIZING"
      >
        {t.independentPrompts && (
          <ol className="independent-prompts">
            {t.independentPrompts.map((p, i) => (
              <li key={i}>
                <RichText>{p}</RichText>
              </li>
            ))}
          </ol>
        )}
        {qs.map((q) => (
          <QuestionRow key={q.id} q={q} />
        ))}
        <h3>Follow-up questions</h3>
        <ul>
          {t.followUps.map((f, i) => (
            <li key={i}>
              <RichText>{f}</RichText>
            </li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection
        title="Misconceptions and interview answer"
        eyebrow="CHECK YOUR UNDERSTANDING"
      >
        <ul>
          {t.mistakes.map((m, i) => (
            <li key={i}>
              <RichText>{m}</RichText>
            </li>
          ))}
        </ul>
        <h3>Explain it in an interview</h3>
        <RichText as="p">{t.interview}</RichText>
      </LessonSection>
      <LessonSection
        title="Company mentions and relevance"
        eyebrow="EVIDENCE, NOT ASSUMPTIONS"
      >
        <CompanyMentions topic={t} />
      </LessonSection>
      <LessonSection
        title="Next steps and review"
        eyebrow="KEEP THE CONNECTIONS"
      >
        <h3>Prerequisites</h3>
        {t.prerequisites.length ? (
          <TopicLinks ids={t.prerequisites} />
        ) : (
          <p>You can start with this topic.</p>
        )}
        <h3>Related concepts</h3>
        <TopicLinks ids={t.related} />
        <h3>Your review status</h3>
        <p>
          {qs.filter((q) => state.reviews[q.id]).length} of {qs.length}{" "}
          questions assessed · {mastery}% mastery
        </p>
        <Bar value={mastery} />
        <Link to="review" className="button secondary small">
          View review schedule <ArrowRight size={14} />
        </Link>
      </LessonSection>
      <LessonSection title="References">
        <Sources items={t.sources} />
      </LessonSection>
    </>
  );
}

function Companies() {
  const { companies, roles, state } = useApp();
  return (
    <>
      <PageHead
        eyebrow="PREPARE WITH CONTEXT"
        title="Prepare for the role, not just the company."
        description="Teams and roles differ within the same company. Read the evidence alongside the uncertainty."
        action={
          <Link to="compare" className="button secondary">
            Compare companies <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="notice">
        <ShieldCheck size={18} />
        <span>
          <strong>Start with the evidence.</strong> Numeric ratings are inferred
          study priorities. They are separate from interview procedures
          described in official sources.
        </span>
      </div>
      <div className="company-grid" data-section="Company directory">
        {companies.map((c) => (
          <Link to={"companies/" + c.id} className="company-card" key={c.id}>
            <div className="section-head">
              <span
                className="company-mark"
                style={{ color: c.color, background: c.color + "15" }}
              >
                {c.mark || c.short.slice(0, 1)}
              </span>
              <ArrowUpRight size={18} />
            </div>
            <h2>{c.name}</h2>
            <p>{c.overview}</p>
            <div className="tags">
              <Badge>5 role-specific study profiles</Badge>
              <Badge
                tone={c.structureEvidence === "OFFICIAL" ? "green" : "amber"}
              >
                {c.structureEvidence === "OFFICIAL"
                  ? "Official source"
                  : "Needs verification"}
              </Badge>
            </div>
            <div className="company-card-bottom">
              {c.lastVerified
                ? "Sources checked " + c.lastVerified
                : "No verified interview guide"}
              <ChevronRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
function CompanyPage({ id }) {
  const { companies, roles, profiles, dimensions, questions, state } = useApp();
  const c = companies.find((c) => c.id === id),
    [role, setRole] = useState(state.settings.role);
  if (!c) return <Empty title="Company not found" />;
  const p = profiles.find((p) => p.companyId === id && p.roleId === role);
  return (
    <>
      <Link to="companies" className="back-link">
        ← Explore companies
      </Link>
      <PageHead
        eyebrow="COMPANY × ROLE PROFILE"
        title={c.name}
        description={c.overview}
        action={
          <Link className="button secondary" to="compare">
            Compare companies <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="role-profile-select">
        <Select
          label="Role profile"
          value={role}
          onChange={setRole}
          options={roles.map((r) => [r.id, r.name])}
        />
      </div>
      <div className="company-profile-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <span className="eyebrow">STUDY PRIORITIES</span>
              <h2>Study priorities</h2>
            </div>
            <Badge tone="amber">INFERRED</Badge>
          </div>
          <p className="muted">
            These are study recommendations based on role requirements and
            public information, not official interview weightings.
          </p>
          {p?.ratings
            .filter((r) => r.dimensionId !== "math")
            .map((r) => {
              const d = dimensions.find((d) => d.id === r.dimensionId);
              return (
                <details className="rating-detail" key={r.dimensionId}>
                  <summary>
                    <span>{d?.title || r.dimensionId}</span>
                    <Stars n={r.importance} />
                    <Badge tone="amber">{r.confidence} confidence</Badge>
                  </summary>
                  <div>
                    <p>{r.reason}</p>
                    <p className="muted">
                      Evidence: {r.evidence} · Rating verified:{" "}
                      {r.lastVerified || "Unverified"} · Applicable roles:{" "}
                      {r.applicableRoles
                        .map((id) => roles.find((r) => r.id === id)?.name)
                        .join(", ")}
                    </p>
                    {r.sourceUrl && (
                      <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                        Source informing this inference{" "}
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <TopicLinks ids={d?.topicIds || []} />
                  </div>
                </details>
              );
            })}
        </section>
        <div className="right-stack">
          <section className="panel">
            <div className="section-head">
              <h2>Interview structure</h2>
              <Badge
                tone={c.structureEvidence === "OFFICIAL" ? "green" : "amber"}
              >
                {c.structureEvidence}
              </Badge>
            </div>
            <ol className="process-list">
              {c.structure.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <p className="muted">{c.notes}</p>
          </section>
          <section className="quote-card">
            <span className="eyebrow">PREPARATION STRATEGY</span>
            <h3>What to prioritize</h3>
            <p>
              {Array.isArray(c.priority) ? c.priority.join(" ") : c.priority}
            </p>
            <h3>What not to over-prioritize</h3>
            <p>{Array.isArray(c.avoid) ? c.avoid.join(" ") : c.avoid}</p>
            <Link to="practice">
              Build a practice plan <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </div>
      <section className="panel section-spaced">
        <h2>Role-specific preparation</h2>
        <p className="muted">{p?.expectationsNote}</p>
        <div className="expectations-grid">
          {Object.entries(p?.expectations || {}).map(([key, text]) => (
            <div key={key}>
              <h3>
                {
                  {
                    math: "Mathematics",
                    ml: "ML",
                    coding: "Algorithms coding",
                    mlcoding: "ML implementation",
                    research: "Research",
                    systems: "Systems",
                  }[key]
                }
              </h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel section-spaced">
        <h2>Related practice questions</h2>
        <p className="muted">
          Original exercises selected for preparation relevance. They are not
          presented as questions asked by the company.
        </p>
        {questions
          .filter((q) => q.companies.includes(id) && q.roles.includes(role))
          .slice(0, 6)
          .map((q) => (
            <QuestionRow key={q.id} q={q} />
          ))}
      </section>
      <section className="panel section-spaced">
        <h2>Sources and evidence</h2>
        <Sources items={c.sources} />
      </section>
    </>
  );
}
function Compare() {
  const { companies, roles, profiles, dimensions, state } = useApp();
  const [role, setRole] = useState(state.settings.role),
    [chosen, setChosen] = useState([
      "deepmind",
      "openai",
      "anthropic",
      "meta",
      "nvidia",
    ]);
  return (
    <>
      <PageHead
        eyebrow="COMPARE THE ROLE, NOT THE LOGO"
        title="Compare companies and roles"
        description="Use these ratings to guide preparation. Unsupported differences between companies are not invented."
      />
      <div className="panel compare-controls" data-section="Compare settings">
        <Select
          label="Role to compare"
          value={role}
          onChange={setRole}
          options={roles.map((r) => [r.id, r.name])}
        />
        <div className="tags">
          {companies.map((c) => (
            <label key={c.id} className="check-label">
              <input
                type="checkbox"
                checked={chosen.includes(c.id)}
                onChange={() =>
                  setChosen((x) =>
                    x.includes(c.id)
                      ? x.filter((id) => id !== c.id)
                      : [...x, c.id],
                  )
                }
              />
              {c.short}
            </label>
          ))}
        </div>
      </div>
      <div className="notice">
        All ratings are INFERRED role-based study priorities. Open a cell to
        inspect confidence, applicable roles, sources, and verification dates.
      </div>
      <div className="panel table-scroll" data-section="Role comparison">
        <table className="comparison">
          <caption>
            {roles.find((r) => r.id === role)?.name} — Study priorities (1–5)
          </caption>
          <thead>
            <tr>
              <th scope="col">Competency</th>
              {companies
                .filter((c) => chosen.includes(c.id))
                .map((c) => (
                  <th scope="col" key={c.id}>
                    <Link to={"companies/" + c.id}>{c.short}</Link>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {dimensions
              .filter((d) => d.id !== "math")
              .map((d) => (
                <tr key={d.id}>
                  <th scope="row">{d.title}</th>
                  {companies
                    .filter((c) => chosen.includes(c.id))
                    .map((c) => {
                      const r = profiles
                        .find((p) => p.companyId === c.id && p.roleId === role)
                        ?.ratings.find((r) => r.dimensionId === d.id);
                      return (
                        <td key={c.id} className={"heat heat-" + r?.importance}>
                          {r && (
                            <details>
                              <summary>
                                <Stars n={r.importance} />
                                <small>{r.confidence} · Inferred</small>
                              </summary>
                              <div className="cell-detail">
                                <p>{r.reason}</p>
                                <p>
                                  {r.evidence} ·{" "}
                                  {r.lastVerified || "Rating unverified"}
                                </p>
                                <p>
                                  Applies to: {r.applicableRoles.join(", ")}
                                </p>
                                {r.sourceUrl && (
                                  <a
                                    href={r.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Reference source ↗
                                  </a>
                                )}
                                <TopicLinks ids={d.topicIds} />
                              </div>
                            </details>
                          )}
                        </td>
                      );
                    })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function TargetForm({ settings, onChange, compact = false }) {
  const { companies, roles, topics } = useApp();
  const set = (k, v) => onChange({ ...settings, [k]: v });
  return (
    <div className="target-form">
      <div className="filter-row">
        <Select
          label="Target role"
          value={settings.role}
          onChange={(v) => set("role", v)}
          options={roles.map((r) => [r.id, r.name])}
        />
        <Select
          label="Time available"
          value={settings.minutes}
          onChange={(v) => set("minutes", Number(v))}
          options={[
            [30, "30 minutes"],
            [45, "45 minutes"],
            [60, "60 minutes"],
            [90, "90 minutes"],
          ]}
        />
        <Select
          label="Challenge level"
          value={settings.difficulty}
          onChange={(v) => set("difficulty", Number(v))}
          options={[
            [1, "1 — Fundamentals"],
            [2, "2 — Easy"],
            [3, "3 — Medium"],
            [4, "4 — Hard"],
            [5, "5 — Research-level"],
          ]}
        />
        <label className="field">
          Interview date
          <input
            type="date"
            value={settings.interviewDate}
            onChange={(e) => set("interviewDate", e.target.value)}
          />
        </label>
      </div>
      <fieldset>
        <legend>
          Target companies <small>Select more than one</small>
        </legend>
        <div className="company-select">
          {companies.map((c) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={settings.companies.includes(c.id)}
              className={settings.companies.includes(c.id) ? "active" : ""}
              onClick={() =>
                set(
                  "companies",
                  settings.companies.includes(c.id)
                    ? settings.companies.filter((id) => id !== c.id)
                    : [...settings.companies, c.id],
                )
              }
            >
              {settings.companies.includes(c.id) && <Check size={13} />}{" "}
              {c.short}
            </button>
          ))}
        </div>
      </fieldset>
      <Details title={`Choose weak areas (${settings.weak.length})`}>
        <div className="weak-select">
          {topics.map((t) => (
            <label className="check-label" key={t.id}>
              <input
                type="checkbox"
                checked={settings.weak.includes(t.id)}
                onChange={() =>
                  set(
                    "weak",
                    settings.weak.includes(t.id)
                      ? settings.weak.filter((id) => id !== t.id)
                      : [...settings.weak, t.id],
                  )
                }
              />
              {t.title}
            </label>
          ))}
        </div>
      </Details>
    </div>
  );
}
function Practice() {
  const { state, update, questions, topics, profiles, toast } = useApp();
  const [settings, setSettings] = useState(state.settings),
    [active, setActive] = useState(null),
    [showConfig, setShowConfig] = useState(!state.plan);
  const plan = state.plan;
  const build = () => {
    if (!settings.companies.length) {
      toast("Select at least one target company.");
      return;
    }
    const p = generatePlan(questions, topics, profiles, { ...state, settings });
    update((s) => ({ ...s, settings, plan: p }));
    setShowConfig(false);
    setActive(null);
    toast("Your practice plan is ready.");
  };
  const current = questions.find((q) => q.id === active);
  return (
    <>
      <PageHead
        eyebrow="DELIBERATE PRACTICE"
        title="What will you practice today?"
        description="Your plan balances due reviews, weak areas, role relevance, and recent practice."
        action={
          <Button secondary small onClick={() => setShowConfig(!showConfig)}>
            <Settings size={15} /> Plan settings
          </Button>
        }
      />
      {showConfig && (
        <section className="panel section-spaced" data-section="Plan settings">
          <TargetForm settings={settings} onChange={setSettings} />
          <Button onClick={build}>
            Generate my practice <ArrowRight size={16} />
          </Button>
        </section>
      )}
      {plan && (
        <>
          <div className="session-summary">
            <div>
              <span className="eyebrow">YOUR PRACTICE SESSION</span>
              <h2>{plan.budget} minutes of focus</h2>
              <p>
                {plan.items.length} questions · {plan.budget - plan.remaining}{" "}
                min of problem solving
                {plan.remaining > 0 &&
                  ` + ${plan.remaining} min of explanation and mistake review`}
              </p>
            </div>
            <div>
              <Badge tone="green">
                {
                  plan.items.filter(
                    (i) => state.reviews[i.id]?.lastReviewed >= plan.created,
                  ).length
                }{" "}
                / {plan.items.length} assessed
              </Badge>
              <Button secondary small onClick={build}>
                Regenerate plan <RotateCcw size={14} />
              </Button>
            </div>
          </div>
          <div className="practice-layout">
            <section className="panel plan-list">
              {plan.items.map((item, i) => {
                const q = questions.find((q) => q.id === item.id),
                  done = state.reviews[item.id]?.lastReviewed >= plan.created;
                return (
                  <button
                    key={item.id}
                    className={cx("plan-item", active === q.id && "active")}
                    onClick={() => setActive(q.id)}
                  >
                    <span className="step-number">
                      {done ? (
                        <Check size={16} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <div>
                      <small>
                        {categories[item.category]} · {item.minutes} min
                      </small>
                      <h3>{q.title}</h3>
                      <p>{planReason(item.reason)}</p>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
              <div className="panel-note">
                If the foundations are unfamiliar, start with the linked lesson.
                Alternate problem solving with spoken explanations.
              </div>
            </section>
            <div>
              {current ? (
                <QuestionCard q={current} key={current.id} />
              ) : (
                <div className="panel start-session">
                  <Play size={35} />
                  <h2>Ready to think it through?</h2>
                  <p>
                    Close your notes and start with the first question.
                    <br />
                    Use a hint if you get stuck, then check and rate your
                    answer.
                  </p>
                  {plan.items[0] && (
                    <Button onClick={() => setActive(plan.items[0].id)}>
                      Start first question <ArrowRight size={16} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {!plan && !showConfig && <Empty title="Create a plan to begin" />}
    </>
  );
}
function Mock() {
  const {
    state,
    update,
    questions,
    topics,
    profiles,
    companies,
    roles,
    toast,
    grade,
  } = useApp();
  const [company, setCompany] = useState(
      state.settings.companies[0] || "deepmind",
    ),
    [role, setRole] = useState(state.settings.role),
    [duration, setDuration] = useState(45),
    [difficulty, setDifficulty] = useState(3),
    [focus, setFocus] = useState("all"),
    [hints, setHints] = useState(false),
    [tick, setTick] = useState(Date.now()),
    [confirm, setConfirm] = useState(false);
  const mock = state.mock;
  useEffect(() => {
    if (!mock || mock.completed) return;
    const i = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, [mock?.end, mock?.completed]);
  const remaining = mock ? Math.max(0, Math.ceil((mock.end - tick) / 1000)) : 0;
  useEffect(() => {
    if (mock && !mock.completed && remaining === 0) {
      update((s) => ({
        ...s,
        mock: { ...s.mock, completed: true, completedAt: Date.now() },
      }));
      toast(
        "Time is up. Your mock interview is complete. Review your answers.",
      );
    }
  }, [remaining, mock?.completed]);
  const start = () => {
    const plan = generatePlan(questions, topics, profiles, state, {
      minutes: Number(duration),
      companies: [company],
      role,
      difficulty: Number(difficulty),
      focus,
    });
    if (!plan.items.length) {
      toast(
        "No questions fit these settings. Allow more time or change your focus.",
      );
      return;
    }
    const now = Date.now();
    setTick(now);
    update((s) => ({
      ...s,
      mock: {
        ids: plan.items.map((i) => i.id),
        company,
        role,
        difficulty,
        focus,
        duration: Number(duration),
        allowHints: hints,
        start: now,
        end: now + Number(duration) * 60000,
        index: 0,
        confidence: {},
        answers: {},
        ratings: {},
        completed: false,
      },
    }));
  };
  const q = mock && questions.find((q) => q.id === mock.ids[mock.index]);
  if (mock?.completed) {
    const rated = Object.keys(mock.ratings),
      vals = Object.values(mock.ratings),
      score = rated.length
        ? Math.round(
            (vals.reduce(
              (s, r) => s + { again: 0, hard: 1, good: 2, easy: 3 }[r],
              0,
            ) /
              (rated.length * 3)) *
              100,
          )
        : null;
    const strong = mock.ids.filter((id) =>
        ["good", "easy"].includes(mock.ratings[id]),
      ),
      weak = mock.ids.filter(
        (id) => mock.ratings[id] === "again" || mock.ratings[id] === "hard",
      );
    return (
      <>
        <PageHead
          eyebrow="REFLECT, THEN IMPROVE"
          title="Interview recap"
          description="Compare your answers with the solutions and checkpoints. The score summarizes your own assessment."
          action={
            <Button
              secondary
              onClick={() => {
                update((s) => ({ ...s, mock: null }));
                setConfirm(false);
              }}
            >
              New mock interview
            </Button>
          }
        />
        <div className="stats-grid">
          <div className="stat">
            <span>Self-assessed score</span>
            <strong>{score === null ? "—" : score + "%"}</strong>
            <small>
              {rated.length} / {mock.ids.length} rated
            </small>
          </div>
          <div className="stat">
            <span>Well-explained questions</span>
            <strong>{strong.length}</strong>
            <small>Good or Easy</small>
          </div>
          <div className="stat">
            <span>Questions to improve</span>
            <strong>{weak.length}</strong>
            <small>Again or Hard</small>
          </div>
          <div className="stat">
            <span>Time used</span>
            <strong>
              {Math.min(
                mock.duration,
                Math.ceil((mock.completedAt - mock.start) / 60000),
              )}
              min
            </strong>
            <small>Time allowed {mock.duration} min</small>
          </div>
        </div>
        <div className="notice">
          Compare your confidence with your answers, including skipped
          questions. Your ratings also update the review schedule.
        </div>
        {mock.ids.map((id, i) => {
          const item = questions.find((q) => q.id === id);
          return (
            <details key={id} className="panel mock-result">
              <summary>
                <span>
                  Q{String(i + 1).padStart(2, "0")} · {item.title}
                </span>
                <Badge>
                  {mock.ratings[id] || "Not rated"} · confidence{" "}
                  {mock.confidence[id] || "—"}/4
                </Badge>
                <Plus size={16} />
              </summary>
              <div className="mock-answer">
                <h3>Your interview answer</h3>
                <pre>{mock.answers[id] || "(No answer)"}</pre>
                <h3>Key answer</h3>
                <p>
                  <RichText>{item.shortAnswer}</RichText>
                </p>
                <p>
                  <RichText>{item.intuition}</RichText>
                </p>
                <Details title="Equations, code, and checkpoints">
                  <div className="math-text">
                    <RichText>{item.derivation}</RichText>
                  </div>
                  {item.implementation && <Code value={item.implementation} />}
                  <ul>
                    {item.rubric?.map((r, j) => (
                      <li key={j}>
                        <RichText>{r}</RichText>
                      </li>
                    ))}
                  </ul>
                </Details>
                <div className="rating-buttons">
                  {["again", "hard", "good", "easy"].map((r) => (
                    <button
                      key={r}
                      disabled={!!mock.ratings[id]}
                      onClick={() => {
                        grade(id, r);
                        update((s) => ({
                          ...s,
                          mock: {
                            ...s.mock,
                            ratings: { ...s.mock.ratings, [id]: r },
                          },
                        }));
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <TopicLinks ids={item.topics} />
              </div>
            </details>
          );
        })}
        <section className="panel section-spaced">
          <h2>Your next practice</h2>
          {strong.length > 0 && (
            <>
              <h3>Strong areas</h3>
              <TopicLinks
                ids={[
                  ...new Set(
                    strong.flatMap(
                      (id) => questions.find((q) => q.id === id).topics,
                    ),
                  ),
                ]}
              />
            </>
          )}
          <h3>Areas to improve</h3>
          {weak.length ? (
            <>
              <p>
                Review the concepts behind the questions you struggled with,
                then explain them again without looking at the solution.
              </p>
              <TopicLinks
                ids={[
                  ...new Set(
                    weak.flatMap(
                      (id) => questions.find((q) => q.id === id).topics,
                    ),
                  ),
                ]}
              />
            </>
          ) : (
            <p>Rate each answer to reveal the concepts that need more work.</p>
          )}
          <Link
            to="practice"
            className="button"
            onClick={() =>
              update((s) => ({
                ...s,
                plan: null,
                settings: {
                  ...s.settings,
                  companies: [mock.company],
                  role: mock.role,
                  weak: [
                    ...new Set([
                      ...s.settings.weak,
                      ...weak.flatMap(
                        (id) => questions.find((q) => q.id === id).topics,
                      ),
                    ]),
                  ],
                },
              }))
            }
          >
            Plan the next session <ArrowRight size={16} />
          </Link>
        </section>
      </>
    );
  }
  if (mock) {
    return (
      <>
        <div className="mock-header">
          <div>
            <span className="eyebrow">INTERVIEW IN PROGRESS</span>
            <h2>
              {companies.find((c) => c.id === mock.company)?.short}{" "}
              <span>· {roles.find((r) => r.id === mock.role)?.name}</span>
            </h2>
          </div>
          <div className={cx("mock-clock", remaining < 300 && "urgent")}>
            <Clock size={18} />
            {timeText(remaining)}
          </div>
        </div>
        <div className="mock-nav">
          {mock.ids.map((id, i) => (
            <button
              key={id}
              className={mock.index === i ? "active" : ""}
              onClick={() =>
                update((s) => ({ ...s, mock: { ...s.mock, index: i } }))
              }
            >
              Q{i + 1}
              {mock.answers[id]?.trim() && <Check size={13} />}
            </button>
          ))}
          <Button secondary small onClick={() => setConfirm(true)}>
            End interview
          </Button>
        </div>
        {confirm && (
          <div className="notice">
            <span>Finish now and review your answers?</span>
            <Button
              small
              onClick={() =>
                update((s) => ({
                  ...s,
                  mock: { ...s.mock, completed: true, completedAt: Date.now() },
                }))
              }
            >
              Finish and review
            </Button>
            <Button secondary small onClick={() => setConfirm(false)}>
              Keep working
            </Button>
          </div>
        )}
        <div className="mock-isolation">
          <div className="question-topline">
            <Badge>{typeNames[q.type] || q.type}</Badge>
            <span>
              Q{mock.index + 1} / {mock.ids.length}
            </span>
          </div>
          <h1>{q.title}</h1>
          <div className="question-prompt">
            <RichText>{q.question}</RichText>
          </div>
          <label className="field">
            Interview answer / code
            <textarea
              rows={14}
              spellCheck={false}
              value={mock.answers[q.id] || ""}
              onChange={(e) => {
                const answer = e.target.value;
                update((s) => ({
                  ...s,
                  mock: {
                    ...s.mock,
                    answers: { ...s.mock.answers, [q.id]: answer },
                  },
                }));
              }}
              placeholder="Write your assumptions and reasoning as if explaining them to an interviewer."
            />
          </label>
          {mock.allowHints && (
            <Details title="Show hint">
              <p>
                <RichText>{q.hints[0]}</RichText>
              </p>
            </Details>
          )}
          <Select
            label="Answer confidence"
            value={mock.confidence[q.id] || ""}
            onChange={(v) =>
              update((s) => ({
                ...s,
                mock: {
                  ...s.mock,
                  confidence: { ...s.mock.confidence, [q.id]: v },
                },
              }))
            }
            options={[
              ["", "Choose"],
              ["1", "1 — Unsure"],
              ["2", "2 — Uncertain"],
              ["3", "3 — Mostly confident"],
              ["4", "4 — Can explain thoroughly"],
            ]}
          />
          <div className="question-controls">
            <Button
              secondary
              disabled={mock.index === 0}
              onClick={() =>
                update((s) => ({
                  ...s,
                  mock: { ...s.mock, index: s.mock.index - 1 },
                }))
              }
            >
              Previous question
            </Button>
            <Button
              onClick={() =>
                mock.index < mock.ids.length - 1
                  ? update((s) => ({
                      ...s,
                      mock: { ...s.mock, index: s.mock.index + 1 },
                    }))
                  : setConfirm(true)
              }
            >
              {mock.index < mock.ids.length - 1
                ? "Next / skip"
                : "Finish interview"}{" "}
              <ArrowRight size={16} />
            </Button>
          </div>
          <p className="muted">
            Your answers and timer are saved automatically. Time keeps running
            if you close the tab. Solutions appear after the interview ends.
          </p>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHead
        eyebrow="THINK UNDER REAL CONSTRAINTS"
        title="Mock interview"
        description="Practice structured thinking and clear reasoning under a time limit. Solutions open after you finish."
      />
      <div className="mock-setup">
        <section className="panel">
          <h2>Set up your interview</h2>
          <div className="form-grid">
            <Select
              label="Target companies"
              value={company}
              onChange={setCompany}
              options={companies.map((c) => [c.id, c.name])}
            />
            <Select
              label="Role"
              value={role}
              onChange={setRole}
              options={roles.map((r) => [r.id, r.name])}
            />
            <Select
              label="Duration"
              value={duration}
              onChange={setDuration}
              options={[
                [30, "30 minutes"],
                [45, "45 minutes"],
                [60, "60 minutes"],
                [90, "90 minutes"],
              ]}
            />
            <Select
              label="Target difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                [1, "Fundamentals"],
                [2, "Easy"],
                [3, "Medium"],
                [4, "Hard"],
                [5, "Research-level"],
              ]}
            />
            <Select
              label="Focus area"
              value={focus}
              onChange={setFocus}
              options={[
                ["all", "Mixed, role-focused interview"],
                ...Object.entries(categories),
              ]}
            />
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={hints}
              onChange={(e) => setHints(e.target.checked)}
            />{" "}
            Allow practice hints
          </label>
          <Button onClick={start}>
            <Mic size={17} /> Start mock interview
          </Button>
        </section>
        <div className="mock-intro">
          <span className="large-symbol">∴</span>
          <h2>
            Show how you think,
            <br />
            not just what you know.
          </h2>
          <p>
            Define the problem clearly.
            <br />
            State your assumptions and test a small example.
            <br />
            Keep explaining your reasoning, even when you get stuck.
          </p>
          <div className="notice">
            This is an original practice interview. It does not reproduce a
            specific company's interview process or automatically predict hiring
            outcomes.
          </div>
        </div>
      </div>
    </>
  );
}
function Review() {
  const { state, due, questions, topics, update } = useApp();
  const [active, setActive] = useState(null),
    [filter, setFilter] = useState("all");
  const scheduled = questions
    .filter((q) => state.reviews[q.id])
    .sort(
      (a, b) => state.reviews[a.id].nextReview - state.reviews[b.id].nextReview,
    );
  const mistakes = state.mistakes.filter(
    (m) =>
      filter === "all" ||
      questions.find((q) => q.id === m.questionId)?.topics.includes(filter),
  );
  const counts = {};
  state.mistakes.forEach((m) =>
    questions
      .find((q) => q.id === m.questionId)
      ?.topics.forEach((id) => (counts[id] = (counts[id] || 0) + 1)),
  );
  return (
    <>
      <PageHead
        eyebrow="MAKE KNOWLEDGE STICK"
        title="Time to bring it back"
        description="Recall before you forget. Use the reasons behind your mistakes as cues for the next problem."
      />
      <section className="reader-section" data-section="Due reviews">
        <div className="section-head">
          <h2>Due reviews</h2>
          <Badge>{due.length} due</Badge>
        </div>
        {active ? (
          <>
            <Button secondary small onClick={() => setActive(null)}>
              Back to reviews
            </Button>
            <QuestionCard
              key={active}
              q={questions.find((q) => q.id === active)}
            />
          </>
        ) : (
          <div className="panel">
            {due.length ? (
              due.map((q) => (
                <button
                  className="review-row"
                  key={q.id}
                  onClick={() => setActive(q.id)}
                >
                  <RotateCcw size={17} />
                  <span>
                    {q.title}
                    <small>
                      Due {formatDate(state.reviews[q.id].nextReview)} ·{" "}
                      {state.reviews[q.id].reviewCount} assessments
                    </small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))
            ) : (
              <Empty
                title="You have no reviews due right now"
                action={
                  <Link className="button" to="practice">
                    Practice a new question <ArrowRight size={15} />
                  </Link>
                }
              >
                Solve a question and rate it Again, Hard, Good, or Easy to
                schedule a review.
              </Empty>
            )}
          </div>
        )}
      </section>
      <section className="reader-section" data-section="Review schedule">
        <h2>Review schedule</h2>
        <div className="panel">
          {scheduled.length ? (
            scheduled.map((q) => (
              <Link className="simple-row" key={q.id} to={"questions/" + q.id}>
                <div>
                  <h3>{q.title}</h3>
                  <small>
                    {state.reviews[q.id].reviewCount} assessments · Mastery{" "}
                    {effectiveMastery(state.reviews[q.id])}%
                  </small>
                </div>
                <span>
                  {new Date(state.reviews[q.id].nextReview).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </Link>
            ))
          ) : (
            <Empty title="No reviews scheduled yet" />
          )}
        </div>
      </section>
      <section className="reader-section" data-section="Mistake notebook">
        <div className="section-head">
          <h2>Mistake notebook</h2>
          <Badge>{state.mistakes.length} entries</Badge>
        </div>
        <div className="panel mistake-summary">
          <h3>Recurring mistake patterns</h3>
          <div className="tags">
            {Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([id, n]) => (
                <button className="tag" key={id} onClick={() => setFilter(id)}>
                  {topics.find((t) => t.id === id)?.title} · {n} times
                </button>
              ))}
          </div>
          <Select
            label="Filter by topic"
            value={filter}
            onChange={setFilter}
            options={[
              ["all", "All mistakes"],
              ...topics.filter((t) => counts[t.id]).map((t) => [t.id, t.title]),
            ]}
          />
        </div>
        {mistakes.length ? (
          mistakes
            .slice()
            .reverse()
            .map((m) => (
              <article className="panel mistake-entry" key={m.id}>
                <div className="section-head">
                  <Link to={"questions/" + m.questionId}>
                    <h3>
                      {questions.find((q) => q.id === m.questionId)?.title}
                    </h3>
                  </Link>
                  <button
                    className="icon-button"
                    aria-label="Delete mistake"
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        mistakes: s.mistakes.filter((x) => x.id !== m.id),
                      }))
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <small>{formatDate(m.at)}</small>
                <dl>
                  {[
                    ["thought", "What I thought"],
                    ["why", "Why it was wrong"],
                    ["principle", "Correct principle"],
                    ["signal", "Cue for next time"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{m[key]}</dd>
                    </div>
                  ))}
                </dl>
                <TopicLinks
                  ids={questions.find((q) => q.id === m.questionId)?.topics}
                />
              </article>
            ))
        ) : (
          <Empty title="Turn mistakes into learning cues">
            Add a mistake to your notebook below a question's solution.
          </Empty>
        )}
      </section>
    </>
  );
}
function downloadFile(name, content, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Progress() {
  const { state, questions, topics, companies, roles, update, toast } =
    useApp();
  const [pending, setPending] = useState(null),
    [importError, setImportError] = useState("");
  const input = useRef();
  const practiced = questions.filter((q) => state.reviews[q.id]),
    mastered = practiced.filter(
      (q) => effectiveMastery(state.reviews[q.id]) >= 80,
    ),
    days = [...Array(84)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 83 + i);
      return isoDay(d.getTime());
    });
  const counts = state.history.reduce((a, h) => {
    const day = isoDay(h.at);
    a[day] = (a[day] || 0) + 1;
    return a;
  }, {});
  const total = questions.reduce(
    (s, q) => s + effectiveMastery(state.reviews[q.id]),
    0,
  );
  const onImport = async (e) => {
    setImportError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choose a backup file smaller than 10 MB.");
      const parsed = JSON.parse(await file.text());
      const validated = validateImport(
        parsed,
        questions.map((q) => q.id),
        topics.map((t) => t.id),
        companies.map((c) => c.id),
        roles.map((r) => r.id),
      );
      setPending(validated);
    } catch (err) {
      setImportError(err.message || "The file could not be read.");
    }
    e.target.value = "";
  };
  return (
    <>
      <PageHead
        eyebrow="MEASURE WHAT YOU CAN EXPLAIN"
        title="How deeply do you understand it?"
        description="Track your self-assessment of recall and problem solving. This is not automated grading or a prediction of interview success."
        action={
          <div className="inline-actions">
            <Button
              secondary
              small
              onClick={() =>
                downloadFile(
                  "research-practice-" + isoDay() + ".json",
                  JSON.stringify(state, null, 2),
                )
              }
            >
              <Download size={15} /> Backup
            </Button>
            <Button secondary small onClick={() => input.current.click()}>
              <Upload size={15} /> Restore
            </Button>
            <input
              hidden
              type="file"
              ref={input}
              accept="application/json,.json"
              onChange={onImport}
            />
          </div>
        }
      />
      {importError && (
        <div className="notice danger" role="alert">
          {importError}
        </div>
      )}
      {pending && (
        <div className="notice">
          <span>
            Restore {Object.keys(pending.reviews).length} reviewed questions and{" "}
            {pending.mistakes.length} mistakes. This replaces your current
            records. Download a backup first.
          </span>
          <Button
            small
            onClick={() => {
              update(pending);
              setPending(null);
              toast("Backup restored.");
            }}
          >
            Restore backup
          </Button>
          <Button small secondary onClick={() => setPending(null)}>
            Cancel
          </Button>
        </div>
      )}
      <div className="stats-grid">
        {[
          [
            "Overall mastery",
            Math.round(total / questions.length) + "%",
            "Includes unseen questions and time decay",
          ],
          [
            "Questions assessed",
            practiced.length + "/" + questions.length,
            "Independent of page views",
          ],
          [
            "Confident recall",
            mastered.length,
            "Effective mastery of at least 80%",
          ],
          [
            "Total recall attempts",
            state.history.length,
            "Completed self-assessments",
          ],
        ].map(([label, n, detail]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{n}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      <div className="progress-grid">
        <section className="panel">
          <div className="section-head">
            <h2>Mastery by area</h2>
            <Badge>MASTERY, NOT VIEWS</Badge>
          </div>
          {Object.entries(categories).map(([cat, name]) => {
            const value = categoryMastery(
              cat,
              topics,
              questions,
              state.reviews,
            );
            return (
              <div className="mastery-row" key={cat}>
                <div>
                  <span>
                    <Icon name={cat} size={15} /> {name}
                  </span>
                  <strong>{value}%</strong>
                </div>
                <Bar value={value} />
              </div>
            );
          })}
          <Details title="How is mastery calculated?">
            <p>
              Again subtracts 25 points; Hard, Good, and Easy add 8, 20, and 30
              points, respectively, within a 0–100 range. Scores gradually decay
              after a review becomes overdue. Each area averages its question
              scores, including unassessed questions at zero. Use the solutions
              and checkpoints to make your self-assessment more accurate.
            </p>
          </Details>
        </section>
        <section className="panel">
          <span className="eyebrow">CONSISTENCY COMPOUNDS</span>
          <h2>Your last 12 weeks</h2>
          <div className="heatmap" aria-label="Daily assessment count">
            {days.map((day) => (
              <span
                key={day}
                title={`${day}: ${counts[day] || 0} times`}
                aria-label={`${day}: ${counts[day] || 0} times`}
                className={
                  "level-" + Math.min(4, Math.ceil((counts[day] || 0) / 2))
                }
              />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>12 weeks ago</span>
            <span>Today · Light: 0 → Dark: 7+ attempts</span>
          </div>
          <h3>What to focus on next</h3>
          {topics
            .filter((t) => questions.some((q) => q.topics.includes(t.id)))
            .map((t) => ({
              ...t,
              value: topicMastery(t.id, questions, state.reviews),
            }))
            .sort((a, b) => a.value - b.value)
            .slice(0, 5)
            .map((t) => (
              <Link className="simple-row" key={t.id} to={"study/" + t.id}>
                <span>{t.title}</span>
                <Badge>{t.value}%</Badge>
              </Link>
            ))}
        </section>
      </div>
      <section className="panel section-spaced">
        <div className="section-head">
          <h2>Your answer archive</h2>
          <Button
            small
            secondary
            onClick={() =>
              downloadFile(
                "research-practice-answers.md",
                Object.entries(state.drafts)
                  .filter(([, v]) => v.trim())
                  .map(
                    ([id, v]) =>
                      "## " +
                      questions.find((q) => q.id === id)?.title +
                      "\n\n" +
                      v,
                  )
                  .join("\n\n"),
                "text/markdown",
              )
            }
          >
            <Download size={14} /> Export answers
          </Button>
        </div>
        {Object.keys(state.drafts).some((id) => state.drafts[id].trim()) ? (
          Object.entries(state.drafts)
            .filter(([, v]) => v.trim())
            .slice(-8)
            .reverse()
            .map(([id, v]) => (
              <Link key={id} className="simple-row" to={"questions/" + id}>
                <span>{questions.find((q) => q.id === id)?.title}</span>
                <small>{v.length} characters</small>
              </Link>
            ))
        ) : (
          <p className="muted">The answers you write are collected here.</p>
        )}
      </section>
    </>
  );
}
function SettingsPage() {
  const { state, update, toast } = useApp();
  const [settings, setSettings] = useState(state.settings);
  return (
    <>
      <PageHead
        eyebrow="MAKE IT YOURS"
        title="Your study goals"
        description="These settings shape your daily plan, company relevance, and recommended questions."
      />
      <section className="panel" data-section="Study goals">
        <TargetForm settings={settings} onChange={setSettings} />
        <Button
          onClick={() => {
            if (!settings.companies.length) {
              toast("Select at least one target company.");
              return;
            }
            update((s) => ({ ...s, settings, plan: null }));
            toast("Study goals saved.");
          }}
        >
          Save settings <Check size={16} />
        </Button>
      </section>
      <div className="notice section-spaced">
        <ShieldCheck size={20} />
        <span>
          Your records stay in this browser's localStorage. No account or server
          synchronization is required. Back up your data from Progress before
          switching devices or clearing browser data.
        </span>
      </div>
    </>
  );
}
function Guide() {
  return (
    <>
      <PageHead
        eyebrow="LEARN HOW TO LEARN"
        title="Retrieve more. Reread less."
        description="Make recall and problem solving the core of your review. Read when learning something new, resolving confusion, or checking a mistake."
      />
      <div className="guide-hero">
        <span className="eyebrow">YOUR DEFAULT STUDY LOOP</span>
        <h2>
          Learn. Close your notes. Recall.
          <br />
          Solve. Explain. Check.
        </h2>
        <div className="study-loop">
          {[
            "LEARN",
            "CLOSE NOTES",
            "RECALL",
            "SOLVE",
            "EXPLAIN",
            "CHECK",
            "LOG MISTAKES",
            "SPACED REVIEW",
          ].map((s, i) => (
            <React.Fragment key={s}>
              <span>{s}</span>
              {i < 7 && <ArrowRight size={13} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="study-grid guide-principles">
        {[
          [
            "01",
            "Active recall",
            "Answer before revealing the explanation.",
            "Write the equation from memory, predict what the code will do, and explain it for 60 seconds. Difficulty recalling an answer reveals what to work on next.",
          ],
          [
            "02",
            "Spaced repetition",
            "Space it out, even when it feels familiar.",
            "Again schedules a review in 10 minutes. Other ratings adapt the interval to your review history. Generate the answer again instead of repeatedly reading a familiar solution.",
          ],
          [
            "03",
            "Interleaving",
            "Mix problem types once the basics are in place.",
            "Start with worked examples, then alternate mathematics, ML, coding, and research questions. Practice recognizing which principle a problem needs.",
          ],
          [
            "04",
            "Worked → independent",
            "Gradually remove the scaffolding.",
            "For a difficult derivation, study one example, solve a similar problem with hints, then solve another independently. Finish by explaining your solution aloud.",
          ],
          [
            "05",
            "Error log",
            "Record why you were wrong.",
            "Confusing P(A|B) with P(B|A) is a more useful note than simply getting Bayes wrong. Record a cue you can recognize in the next problem.",
          ],
          [
            "06",
            "Explain out loud",
            "Practice communicating your answer.",
            "Use 30 seconds for the core idea, 60 seconds for intuition and assumptions, and a longer explanation for equations, code, and trade-offs. Speak first, then compare with the solution.",
          ],
        ].map(([n, en, title, desc]) => (
          <article className="panel" key={n}>
            <span className="eyebrow">
              {n} / {en}
            </span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
      <section className="section-spaced">
        <div className="section-head">
          <h2>Make the time you have count</h2>
          <Link to="practice">
            Create my plan <ArrowRight size={15} />
          </Link>
        </div>
        <div className="session-grid">
          {[
            [
              30,
              [
                ["Spaced review", 5],
                ["Math / ML", 10],
                ["Coding", 10],
                ["Verbal explanation", 5],
              ],
            ],
            [
              60,
              [
                ["Spaced review", 10],
                ["Math / theory", 15],
                ["Coding / implementation", 15],
                ["New concept", 10],
                ["Research / verbal questions", 10],
              ],
            ],
            [
              90,
              [
                ["Spaced recall", 15],
                ["Mathematics", 20],
                ["ML · DL", 20],
                ["Coding", 20],
                ["Research reasoning", 15],
              ],
            ],
          ].map(([minutes, rows]) => (
            <section className="panel" key={minutes}>
              <span className="session-minutes">
                {minutes}
                <small>minutes</small>
              </span>
              {rows.map(([label, n]) => (
                <div className="simple-row" key={label}>
                  <span>{label}</span>
                  <strong>{n} min</strong>
                </div>
              ))}
            </section>
          ))}
        </div>
        <p className="muted">
          These schedules are examples. Your actual plan adapts to weaknesses,
          target companies and roles, your interview date, due reviews, and
          question duration.
        </p>
      </section>
      <section className="panel section-spaced">
        <h2>One concept, five steps</h2>
        <div className="concept-flow">
          {["Explain", "Derive", "Implement", "Debug", "Trade-offs"].map(
            (s, i) => (
              <React.Fragment key={s}>
                <div>{s}</div>
                {i < 4 && <ArrowRight size={16} />}
              </React.Fragment>
            ),
          )}
        </div>
        <h3>Example: Softmax + Cross Entropy</h3>
        <ol>
          <li>Explain what softmax does without using equations.</li>
          <li>Derive the cross-entropy gradient with respect to the logits.</li>
          <li>Implement stable softmax by subtracting the maximum logit.</li>
          <li>Fix an implementation that overflows on large logits.</li>
          <li>
            Prove why subtracting the same constant leaves the probabilities
            unchanged.
          </li>
        </ol>
        <TopicLinks ids={["ml-code-softmax", "information"]} />
      </section>
      <section className="panel section-spaced">
        <h2>The evidence behind the method</h2>
        <p>
          Research supports retrieval practice and distributed learning for
          long-term retention. Effects and optimal intervals vary across
          learners. The scheduler in this app has not itself been clinically or
          educationally validated.
        </p>
        <Sources
          items={[
            {
              title: "Roediger & Karpicke (2006) — Test-enhanced learning",
              url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
            },
            {
              title:
                "Dunlosky et al. (2013) — Improving Students’ Learning With Effective Learning Techniques",
              url: "https://doi.org/10.1177/1529100612453266",
            },
          ]}
        />
      </section>
    </>
  );
}
class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="fatal">
          <h1>Something went wrong loading this page.</h1>
          <p>
            Your records remain in this browser. Reload the page and try again.
          </p>
          <button onClick={() => location.reload()}>Reload</button>
          <button
            onClick={() =>
              downloadFile(
                "research-practice-recovery.json",
                localStorage.getItem(KEY) || "{}",
              )
            }
          >
            Back up records
          </button>
        </div>
      );
    return this.props.children;
  }
}
async function boot() {
  const root = createRoot(document.getElementById("root"));
  root.render(
    <div className="loading">
      <span className="brand-symbol">r∴</span>
      <p>Preparing your study space…</p>
    </div>,
  );
  try {
    const [topics, questions, companyData] = await Promise.all(
      ["curriculum", "questions", "companies"].map(async (name) => {
        const r = await fetch(
          import.meta.env.BASE_URL + "data/" + name + ".json",
          { cache: "no-cache" },
        );
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }),
    );
    root.render(
      <ErrorBoundary>
        <App data={{ topics, questions, ...companyData }} />
      </ErrorBoundary>,
    );
  } catch {
    root.render(
      <div className="fatal">
        <h1>We could not load the study materials.</h1>
        <p>Check your connection and try again.</p>
        <button onClick={() => location.reload()}>Try again</button>
      </div>,
    );
  }
}
boot();
