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
import "./style.css";
const C = createContext();
const useApp = () => useContext(C);
const KEY = "research-practice:v1";
const nav = [
  ["dashboard", "Dashboard", "대시보드", LayoutDashboard],
  ["study", "Study", "학습", BookOpen],
  ["questions", "Questions", "질문 탐색", Layers],
  ["companies", "Companies", "회사 · 직무", Building2],
  ["practice", "Practice", "오늘의 연습", Play],
  ["mock", "Mock Interview", "모의면접", Mic],
  ["review", "Review", "간격 복습", RotateCcw],
  ["progress", "Progress", "학습 진척도", ChartNoAxesCombined],
  ["guide", "Study Guide", "학습 가이드", Compass],
];
const formatDate = (n) =>
  new Date(n).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
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
      aria-label="숙련도"
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
          {s.lastVerified && <small>확인 {s.lastVerified}</small>}
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
    <span className="stars" aria-label={`중요도 ${n}/5`}>
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
        "브라우저 저장 공간을 사용할 수 없습니다. 진척도에서 백업 파일을 내려받아 주세요.",
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
    setToast("평가를 저장하고 다음 복습을 예약했습니다.");
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
        본문으로 이동
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
          aria-label="메뉴 닫기"
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
            당신의 속도로, 더 깊이.
            <br />
            학습 기록은 이 브라우저에 저장됩니다.
          </p>
          <Link to="settings" className="profile">
            <span className="avatar">JR</span>
            <span>
              My research journey<small>목표 및 학습 설정</small>
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
              aria-label="메뉴 열기"
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
              placeholder="개념이나 질문 검색…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="전체 검색"
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
                  <p>검색 결과가 없습니다.</p>
                )}
                <Link to={"questions?search=" + encodeURIComponent(search)}>
                  질문 탐색에서 보기 →
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
              기존 기록의 형식을 읽을 수 없어 덮어쓰기를 중지했습니다. 원본을
              백업한 뒤 새 학습을 시작할 수 있습니다.
            </span>
            <Button
              secondary
              small
              onClick={() =>
                downloadFile("research-practice-recovery.json", recovery)
              }
            >
              원본 기록 백업
            </Button>
            <Button
              secondary
              small
              onClick={() => {
                setRecovery(null);
                setState(defaultState());
              }}
            >
              기존 기록 대신 새로 시작
            </Button>
          </div>
        )}
        {storageError && (
          <div className="notice danger" role="alert">
            {storageError}
          </div>
        )}
        <main id="main-content" tabIndex="-1">
          {page === "dashboard" ? (
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
              title="페이지를 찾을 수 없습니다"
              action={
                <Link className="button" to="dashboard">
                  대시보드로
                </Link>
              }
            />
          )}
        </main>
        <footer className="footer">
          <span>
            RESEARCH PRACTICE <span className="dot-sep">/</span> Understanding
            over memorization.
          </span>
          <Link to="guide">
            학습 원칙 <ArrowUpRight size={12} />
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
        title="오늘의 작은 연습, 내일의 깊은 답변."
        description="기억에서 꺼내고, 직접 구현하고, 자신의 언어로 설명하세요."
        action={
          <Link to="settings" className="button secondary small">
            <Settings size={15} /> 학습 목표 설정
          </Link>
        }
      />
      <section className="dashboard-top">
        <div className="hero">
          <div>
            <Badge tone="green">
              <span className="status-dot" /> PERSONALIZED DAILY PLAN
            </Badge>
            <h2>
              아는 것을,
              <br />
              설명할 수 있는 실력으로.
            </h2>
            <p>
              목표 직무와 복습 일정에 맞춘 오늘의 학습.
              <br />
              수학에서 구현까지, 연결해서 연습하세요.
            </p>
            <div className="hero-actions">
              <Link to="practice" className="button">
                오늘의 연습 시작 <ArrowRight size={17} />
              </Link>
              <span>
                <Clock size={14} /> {state.settings.minutes}분 ·{" "}
                {plan.items.length}개 질문
              </span>
            </div>
          </div>
          <div className="hero-diagram" aria-hidden="true">
            <div className="orbit o1" />
            <div className="orbit o2" />
            <div className="orbit o3" />
            <div className="orbit-core">
              ∇<small>understand</small>
            </div>
            <span className="orbit-label ol1">RECALL</span>
            <span className="orbit-label ol2">IMPLEMENT</span>
            <span className="orbit-label ol3">EXPLAIN</span>
            <span className="orbit-point p1" />
            <span className="orbit-point p2" />
            <span className="orbit-point p3" />
          </div>
        </div>
        <div className="focus-card">
          <div className="section-label">
            <Target size={16} /> MY INTERVIEW FOCUS
            <Link to="settings">
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <h3>
            {roles.find((r) => r.id === state.settings.role)?.name ||
              state.settings.role}
          </h3>
          <div className="target-companies">
            {target.map((c) => (
              <Link to={"companies/" + c.id} key={c.id}>
                <span style={{ background: c.color + "15", color: c.color }}>
                  {c.mark || c.short.slice(0, 1)}
                </span>
                {c.short}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
          <div className="focus-date">
            <Calendar size={15} />
            {state.settings.interviewDate
              ? `${formatDate(state.settings.interviewDate + "T12:00:00")} 면접 · ${Math.max(0, Math.ceil((new Date(state.settings.interviewDate + "T12:00:00") - Date.now()) / DAY))}일 남음`
              : "면접일을 설정해 준비 속도를 조절하세요"}
          </div>
        </div>
      </section>
      <div className="stats-grid">
        {[
          [
            RotateCcw,
            "복습할 질문",
            due.length,
            "복습 간격에 따라 돌아온 질문",
            "review",
          ],
          [
            CheckCircle2,
            "오늘의 회상 연습",
            done,
            "답안을 확인하고 직접 평가한 횟수",
            "progress",
          ],
          [
            BookOpen,
            "평가한 질문",
            `${completed} / ${questions.length}`,
            "읽은 페이지가 아닌, 시도한 문제",
            "questions",
          ],
          [
            ChartNoAxesCombined,
            "전체 숙련도",
            avg + "%",
            "미평가 질문 포함 · 자기 평가 기반",
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
            <small>{desc}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel daily-panel">
          <div className="section-head">
            <div>
              <span className="eyebrow">A LITTLE, EVERY DAY</span>
              <h2>오늘의 학습 경로</h2>
            </div>
            <Link to="practice">
              전체 계획 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="timeline">
            {plan.items.slice(0, 5).map((item, i) => {
              const q = questions.find((q) => q.id === item.id);
              return (
                <Link
                  to={"questions/" + q.id}
                  className="timeline-item"
                  key={q.id}
                >
                  <span className={"step-icon cat-" + item.category}>
                    <Icon name={item.category} />
                  </span>
                  <div>
                    <small>
                      {String(i + 1).padStart(2, "0")}{" "}
                      <span className="dot-sep">/</span>{" "}
                      {categories[item.category]}
                    </small>
                    <h3>{q.title}</h3>
                    <p>{item.reason}</p>
                  </div>
                  <span className="time-tag">{item.minutes}분</span>
                  <ChevronRight size={16} />
                </Link>
              );
            })}
          </div>
          <div className="panel-note">
            <FlaskConical size={15} /> 기억하기 → 유도하기 → 구현하기 → 설명하기
          </div>
        </section>
        <div className="right-stack">
          <section className="panel">
            <div className="section-head">
              <div>
                <span className="eyebrow">KNOW YOUR GAPS</span>
                <h2>영역별 준비도</h2>
              </div>
              <Link to="progress" aria-label="진척도 자세히">
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
              미평가 항목은 0%입니다. 합격 확률을 뜻하지 않습니다.
            </small>
          </section>
          <section className="quote-card">
            <span className="eyebrow">THE PRACTICE PRINCIPLE</span>
            <h3>
              “읽어서 익숙한 것과
              <br />
              설명할 수 있는 것은 다릅니다.”
            </h3>
            <p>
              노트를 닫고 60초 동안 설명해 보세요.
              <br />
              막히는 지점이 다음 학습의 출발점입니다.
            </p>
            <Link to="guide">
              효과적으로 공부하는 방법 <ArrowUpRight size={15} />
            </Link>
          </section>
        </div>
      </div>
      <section className="section-spaced">
        <div className="section-head">
          <div>
            <span className="eyebrow">CONNECTED KNOWLEDGE</span>
            <h2>기초부터 연구까지</h2>
          </div>
          <Link to="study">
            전체 커리큘럼 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="track-grid">
          {["math", "mlcoding", "llm", "research"].map((cat) => (
            <Link to={"study?category=" + cat} className="track-card" key={cat}>
              <span className={"track-icon cat-" + cat}>
                <Icon name={cat} size={23} />
              </span>
              <h3>{categories[cat]}</h3>
              <p>
                {
                  {
                    math: "직관에서 수식으로. 모델을 이해하는 언어.",
                    mlcoding: "이론을 코드로. 수치 안정성부터 디버깅까지.",
                    llm: "Attention부터 alignment까지 연결해서.",
                    research: "더 좋은 가설, 더 설득력 있는 실험.",
                  }[cat]
                }
              </p>
              <span>
                {topics.filter((t) => t.category === cat).length}개 주제{" "}
                <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      {state.mistakes.length > 0 && (
        <section className="panel section-spaced">
          <div className="section-head">
            <h2>다시 확인할 오답</h2>
            <Link to="review">
              오답 노트 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="tags">
            {Object.entries(mistakeCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([id, count]) => (
                <Link key={id} className="tag" to={"study/" + id}>
                  {topics.find((t) => t.id === id)?.title} · 오답 {count}회
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
          <small>난이도 {q.difficulty}/5</small>
          <span>·</span>
          <small>{q.expectedTime}분</small>
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
        title="질문 탐색"
        description="먼저 생각하고, 그다음 확인하세요. 모든 질문은 직접 작성한 연습 문제입니다."
      />
      <div className="panel filters">
        <label className="field search-field">
          질문 검색
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
            label="영역"
            value={cat}
            onChange={setCat}
            options={[["all", "전체 영역"], ...Object.entries(categories)]}
          />
          <Select
            label="회사 관련성"
            value={company}
            onChange={setCompany}
            options={[
              ["all", "전체 회사"],
              ...companies.map((c) => [c.id, c.short]),
            ]}
          />
          <Select
            label="직무"
            value={role}
            onChange={setRole}
            options={[
              ["all", "전체 직무"],
              ...roles.map((r) => [r.id, r.name]),
            ]}
          />
          <Select
            label="유형"
            value={type}
            onChange={setType}
            options={[["all", "전체 유형"], ...Object.entries(typeNames)]}
          />
          <Select
            label="난이도"
            value={diff}
            onChange={setDiff}
            options={[
              ["all", "모든 난이도"],
              ...[1, 2, 3, 4, 5].map((n) => [n, `${n} / 5`]),
            ]}
          />
        </div>
      </div>
      <div className="results-head">
        <span>
          <strong>{filtered.length}</strong>개 질문
        </span>
        <label className="check-label">
          <input
            type="checkbox"
            checked={book}
            onChange={(e) => setBook(e.target.checked)}
          />
          <Bookmark size={15} /> 저장한 질문만
        </label>
      </div>
      <div className="panel question-list">
        {filtered.slice(0, limit).map((q) => (
          <QuestionRow q={q} key={q.id} />
        ))}
        {!filtered.length && (
          <Empty title="조건에 맞는 질문이 없습니다">
            검색어나 필터를 조정해 주세요.
          </Empty>
        )}
      </div>
      {filtered.length > limit && (
        <Button secondary onClick={() => setLimit(limit + 30)}>
          30개 더 보기
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
        ← 질문 탐색
      </Link>
      <QuestionCard q={q} />
    </>
  ) : (
    <Empty title="질문을 찾을 수 없습니다" />
  );
}
function QuestionCard({
  q,
  mock = false,
  onConfidence,
  confidence,
  allowHint = true,
}) {
  const { state, update, grade, companies } = useApp();
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
          <Badge tone="amber">난이도 {q.difficulty} / 5</Badge>
          <span className="muted">
            <Clock size={14} /> {q.expectedTime}분
          </span>
        </div>
        <button
          className={cx(
            "icon-button",
            state.bookmarks.includes(q.id) && "selected",
          )}
          aria-label="질문 저장"
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
      <div className="question-prompt">{q.question}</div>
      <div className="recall-prompt">
        <Brain size={18} />
        <span>
          노트를 닫고 자신의 언어로 설명하세요. 식이나 코드를 먼저 써 보세요.
        </span>
      </div>
      <TopicLinks ids={q.topics} />
      <div className="answer-workspace">
        <div className="section-head">
          <label htmlFor={"draft-" + q.id}>나의 답변 / 풀이</label>
          <span className="autosave">이 브라우저에 자동 저장</span>
        </div>
        <textarea
          id={"draft-" + q.id}
          ref={input}
          rows={7}
          value={attempt}
          onChange={(e) => saveDraft(e.target.value)}
          placeholder="가정 → 핵심 원리 → 수식 또는 코드 → 검증 → 트레이드오프"
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
            {revealed ? "해설 접기" : "Show Solution"}{" "}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
      {hints > 0 && (
        <div className="hint-box">
          {q.hints.slice(0, hints).map((h, i) => (
            <p key={i}>
              <strong>Hint {i + 1}.</strong> {h}
            </p>
          ))}
        </div>
      )}
      {!mock && (
        <div className="verbal-bar">
          <Volume2 size={18} />
          <Select
            label="말로 설명하기"
            value={mode}
            onChange={(v) => {
              setMode(Number(v));
              timer.reset(Number(v));
            }}
            options={[
              [30, "30초 핵심 답변"],
              [60, "60초 면접 답변"],
              [180, "3분 깊은 설명"],
            ]}
          />
          <span className="timer">{timeText(timer.left)}</span>
          <button
            className="icon-button"
            aria-label={
              timer.active ? "설명 타이머 일시정지" : "설명 타이머 시작"
            }
            onClick={timer.toggle}
          >
            {timer.active ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            onClick={() => timer.reset(mode)}
            aria-label="타이머 초기화"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
      {mock && (
        <Select
          label="현재 답변 확신도"
          value={confidence || ""}
          onChange={onConfidence}
          options={[
            ["", "선택해 주세요"],
            ["1", "1 — 잘 모르겠음"],
            ["2", "2 — 일부만 설명 가능"],
            ["3", "3 — 대체로 확신"],
            ["4", "4 — 근거까지 설명 가능"],
          ]}
        />
      )}
      {revealed && !mock && (
        <div className="solution">
          <div className="solution-lead">
            <span className="eyebrow">SHORT INTERVIEW ANSWER</span>
            <h2>면접에서는 이렇게 설명하세요</h2>
            <p>{q.shortAnswer}</p>
          </div>
          <Details title="직관 · 상세 설명" open>
            <p>{q.intuition}</p>
          </Details>
          <Details title="수학적 유도 · 추론">
            <div className="math-text">{q.derivation}</div>
          </Details>
          {q.implementation && (
            <Details title="구현 · 코드">
              <Code value={q.implementation} />
            </Details>
          )}
          <Details title="흔한 실수">
            <ul>
              {q.commonMistakes.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Details>
          <Details title="후속 질문">
            <ul>
              {q.followUps.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Details>
          <Details title="관련 개념 · 선수 지식">
            <TopicLinks ids={[...new Set([...q.topics, ...q.prerequisites])]} />
          </Details>
          <Details title="회사 관련성 · 출처">
            <p className="muted">
              아래 회사의 준비에 연결된 자체 연습 문제입니다. 실제 출제되었다는
              뜻은 아닙니다.
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
            <h3>답변 체크리스트</h3>
            <p>
              작성한 답변과 비교해 보세요. 자동 채점이 아닌 자기 평가입니다.
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
                {r}
              </label>
            ))}
          </div>
          <div className="rating-box">
            <span className="eyebrow">HOW WELL DID YOU KNOW THIS?</span>
            <h3>
              {rated
                ? "평가가 저장되었습니다."
                : "해설 없이 얼마나 설명할 수 있었나요?"}
            </h3>
            <div className="rating-buttons">
              {[
                ["again", "Again", "다시 학습"],
                ["hard", "Hard", "어려웠음"],
                ["good", "Good", "잘 기억함"],
                ["easy", "Easy", "쉽게 설명"],
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
                      ? "10분 후"
                      : Math.round(schedule(state.reviews[q.id], r).interval) +
                        "일 후"}
                  </span>
                </button>
              ))}
            </div>
            <Button secondary small onClick={() => setNotebook(!notebook)}>
              <Plus size={15} /> 오답 노트 작성
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
            toast("코드를 복사했습니다.");
          } catch {
            toast("복사할 코드를 직접 선택해 주세요.");
          }
        }}
      >
        복사
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
        toast("오답 노트를 저장했습니다.");
        onSave();
      }}
    >
      <h3>오답에서 다음의 단서 찾기</h3>
      {[
        ["thought", "내가 생각했던 것"],
        ["why", "왜 틀렸는지"],
        ["principle", "올바른 원리"],
        ["signal", "다음에는 어떻게 알아볼지"],
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
        오답 저장 <Check size={15} />
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
        title="연결해서 배우는 AI · ML"
        description="직관 → 수학 → 유도 → 구현 → 디버깅. 흩어진 지식을 하나의 설명으로 연결하세요."
      />
      <div className="tab-pills">
        {[["all", "전체 커리큘럼"], ...Object.entries(categories)].map(
          ([id, name]) => (
            <button
              key={id}
              className={cat === id ? "active" : ""}
              onClick={() => setCat(id)}
            >
              {name}
            </button>
          ),
        )}
      </div>
      <label className="search-field standalone">
        <Search size={17} />
        <input
          aria-label="주제 검색"
          placeholder="개념과 세부 주제로 검색…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>{filtered.length} topics</span>
      </label>
      <div className="study-grid">
        {filtered.map((t) => {
          const mastery = topicMastery(t.id, questions, state.reviews);
          return (
            <Link to={"study/" + t.id} className="topic-card" key={t.id}>
              <div className="section-head">
                <span className={"track-icon cat-" + t.category}>
                  <Icon name={t.category} />
                </span>
                <Badge>{categories[t.category]}</Badge>
              </div>
              <h2>{t.title}</h2>
              <p>{t.summary}</p>
              <div className="topic-subtopics">
                {t.subtopics.slice(0, 5).map((s) => (
                  <span key={s}>{s}</span>
                ))}
                {t.subtopics.length > 5 && (
                  <span>+{t.subtopics.length - 5}</span>
                )}
              </div>
              <div className="topic-card-bottom">
                <span>
                  {questions.filter((q) => q.topics.includes(t.id)).length}개
                  질문
                </span>
                <span>숙련도 {mastery}%</span>
              </div>
              <Bar value={mastery} />
            </Link>
          );
        })}
      </div>
      {!filtered.length && <Empty title="검색 결과가 없습니다" />}
    </>
  );
}
function TopicPage({ id }) {
  const { topics, questions, state, profiles, companies } = useApp();
  const t = topics.find((t) => t.id === id),
    [tab, setTab] = useState("overview");
  useEffect(() => setTab("overview"), [id]);
  if (!t) return <Empty title="주제를 찾을 수 없습니다" />;
  const qs = questions.filter((q) => q.topics.includes(id)),
    mastery = topicMastery(id, questions, state.reviews),
    relevant = profiles.filter(
      (p) =>
        p.roleId === state.settings.role &&
        p.ratings.some(
          (r) => r.dimensionId === t.category && r.importance >= 4,
        ),
    );
  return (
    <>
      <Link className="back-link" to="study">
        ← 커리큘럼
      </Link>
      <PageHead
        eyebrow={categories[t.category]}
        title={t.title}
        description={t.summary}
        action={
          qs[0] && (
            <Link className="button" to={"questions/" + qs[0].id}>
              회상 연습 <ArrowRight size={16} />
            </Link>
          )
        }
      />
      <div className="topic-layout">
        <div>
          <div className="tabs" role="tablist">
            {[
              ["overview", "개요 · 직관"],
              ["math", "수학 · 유도"],
              ["visual", "시각화"],
              ["code", "구현"],
              ["questions", "질문"],
              ["relevance", "회사 관련성"],
            ].map(([key, name]) => (
              <button
                role="tab"
                aria-selected={tab === key}
                key={key}
                onClick={() => setTab(key)}
                className={tab === key ? "active" : ""}
              >
                {name}
              </button>
            ))}
          </div>
          <section className="panel lesson" role="tabpanel">
            {tab === "overview" ? (
              <>
                <span className="eyebrow">INTUITION FIRST</span>
                <h2>무엇이고, 왜 중요한가요?</h2>
                <p>{t.summary}</p>
                <h3>직관으로 이해하기</h3>
                <p>{t.intuition}</p>
                <h3>ML에서는 어떻게 쓰이나요?</h3>
                <p>{t.application}</p>
                <Details title="흔한 오해">
                  <ul>
                    {t.mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </Details>
                <Details title="면접에서 설명하기">
                  <p>{t.interview}</p>
                </Details>
                <Details title="학습할 세부 개념">
                  <div className="tags">
                    {t.subtopics.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                </Details>
              </>
            ) : tab === "math" ? (
              <>
                <span className="eyebrow">FROM FORMULATION TO DERIVATION</span>
                <h2>수학적 표현</h2>
                <div className="math-text">{t.math}</div>
                <h3>한 단계씩 유도하기</h3>
                <div className="math-text">{t.derivation}</div>
                {t.workedExample && (
                  <Details title="Worked example · 숫자로 따라가기" open>
                    <div className="worked-example">{t.workedExample}</div>
                  </Details>
                )}
                <div className="notice">
                  한 번 읽은 뒤 노트를 닫고, 각 등식이 성립하는 이유를 직접 써
                  보세요.
                </div>
                <h3>독립적으로 풀어보기</h3>
                {t.independentPrompts && (
                  <ol className="independent-prompts">
                    {t.independentPrompts.map((prompt, i) => (
                      <li key={i}>{prompt}</li>
                    ))}
                  </ol>
                )}
                {qs
                  .filter(
                    (q) => q.type === "derivation" || q.type === "reasoning",
                  )
                  .map((q) => (
                    <QuestionRow key={q.id} q={q} />
                  ))}
                <TopicLinks ids={t.prerequisites} />
              </>
            ) : tab === "visual" ? (
              <>
                <h2>구조를 눈으로 이해하기</h2>
                {t.visual ? (
                  <Diagram kind={t.visual} />
                ) : (
                  <>
                    <div className="concept-flow">
                      {["선수 개념", t.title, "ML 응용", "회상 · 구현"].map(
                        (x, i) => (
                          <React.Fragment key={i}>
                            <div>{x}</div>
                            {i < 3 && <ArrowRight size={18} />}
                          </React.Fragment>
                        ),
                      )}
                    </div>
                    <p>{t.application}</p>
                    <p className="muted">
                      이 주제의 관계도입니다. 정량적인 시뮬레이션은 아닙니다.
                    </p>
                  </>
                )}
              </>
            ) : tab === "code" ? (
              <>
                <h2>수식에서 구현으로</h2>
                {t.code ? <Code value={t.code} /> : <p>{t.application}</p>}
                <h3>검증하며 구현하기</h3>
                {t.debugging && (
                  <div className="debug-challenge">
                    <span className="eyebrow">PREDICT BEFORE REVEALING</span>
                    <p>{t.debugging.prompt}</p>
                    <Details title="오류의 원인 · 해결 확인">
                      <p>{t.debugging.answer}</p>
                    </Details>
                  </div>
                )}
                <p>
                  입출력 차원, 경계 입력, 수치 안정성을 먼저 확인하세요. 작은
                  예제의 수동 계산과 비교하고 복잡도를 설명해 보세요.
                </p>
                <div className="notice">
                  코드는 NumPy / PyTorch 실습용입니다. 이 정적 사이트에서는
                  Python을 실행하지 않습니다. 코드 복사 또는 답변 파일 저장 후
                  로컬 환경에서 검증하세요.
                </div>
              </>
            ) : tab === "questions" ? (
              <>
                <h2>기억에서 꺼내는 연습</h2>
                {qs.map((q) => (
                  <QuestionRow key={q.id} q={q} />
                ))}
                <Details title="더 깊이 생각할 후속 질문" open>
                  <ul>
                    {t.followUps.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </Details>
              </>
            ) : (
              <>
                <h2>회사 · 직무와 연결하기</h2>
                <p className="muted">
                  선택 직무의 학습 우선순위가 높은 회사입니다. 실제 출제 빈도가
                  아닌 추론 기반 권장치입니다.
                </p>
                {relevant.length ? (
                  relevant.map((p) => {
                    const c = companies.find((c) => c.id === p.companyId);
                    return (
                      <Link
                        className="simple-row"
                        to={"companies/" + c.id}
                        key={c.id}
                      >
                        <span>{c.name}</span>
                        <Badge tone="amber">INFERRED</Badge>
                        <ArrowUpRight size={16} />
                      </Link>
                    );
                  })
                ) : (
                  <p>이 도메인은 지원 팀과 채용 공고에 맞춰 선택하세요.</p>
                )}
              </>
            )}
            <Details title="참고 자료">
              <Sources items={t.sources} />
            </Details>
          </section>
        </div>
        <aside className="topic-aside">
          <section className="panel">
            <span className="eyebrow">YOUR UNDERSTANDING</span>
            <h2>
              {mastery}
              <small>%</small>
            </h2>
            <Bar value={mastery} />
            <p className="muted">
              {qs.filter((q) => state.reviews[q.id]).length} / {qs.length}개
              질문 평가됨
            </p>
            <Link to="review">
              복습 일정 확인 <ArrowRight size={14} />
            </Link>
          </section>
          <section className="panel">
            <h3>먼저 알아둘 개념</h3>
            {t.prerequisites.length ? (
              <TopicLinks ids={t.prerequisites} />
            ) : (
              <p className="muted">이 주제부터 시작해도 좋습니다.</p>
            )}
            <h3>다음으로 연결하기</h3>
            <TopicLinks ids={t.related} />
          </section>
          <div className="quote-card">
            <span className="eyebrow">WORKED → INDEPENDENT</span>
            <p>
              ① 유도와 예제 읽기
              <br />② 힌트와 함께 풀기
              <br />③ 힌트 없이 다시 풀기
              <br />④ 60초로 설명하기
              <br />⑤ 간격을 두고 복습하기
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function Companies() {
  const { companies, roles, state } = useApp();
  return (
    <>
      <PageHead
        eyebrow="PREPARE WITH CONTEXT"
        title="회사보다 구체적으로, 직무까지."
        description="같은 회사에서도 팀과 직무가 다릅니다. 출처와 불확실성을 함께 확인하세요."
        action={
          <Link to="compare" className="button secondary">
            회사 비교 <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="notice">
        <ShieldCheck size={18} />
        <span>
          <strong>근거를 먼저 확인하세요.</strong> 수치 평점은 학습 우선순위에
          대한 추론입니다. 공식 자료의 면접 절차와 별도로 표시합니다.
        </span>
      </div>
      <div className="company-grid">
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
              <Badge>5개 직무별 학습 프로필</Badge>
              <Badge
                tone={c.structureEvidence === "OFFICIAL" ? "green" : "amber"}
              >
                {c.structureEvidence === "OFFICIAL"
                  ? "공식 안내 출처"
                  : "자료 확인 필요"}
              </Badge>
            </div>
            <div className="company-card-bottom">
              {c.lastVerified
                ? "자료 확인 " + c.lastVerified
                : "검증된 면접 안내 없음"}
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
  if (!c) return <Empty title="회사를 찾을 수 없습니다" />;
  const p = profiles.find((p) => p.companyId === id && p.roleId === role);
  return (
    <>
      <Link to="companies" className="back-link">
        ← 회사 탐색
      </Link>
      <PageHead
        eyebrow="COMPANY × ROLE PROFILE"
        title={c.name}
        description={c.overview}
        action={
          <Link className="button secondary" to="compare">
            다른 회사와 비교 <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="tab-pills">
        {roles.map((r) => (
          <button
            key={r.id}
            className={role === r.id ? "active" : ""}
            onClick={() => setRole(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>
      <div className="company-profile-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <span className="eyebrow">STUDY PRIORITIES</span>
              <h2>학습 우선순위</h2>
            </div>
            <Badge tone="amber">INFERRED</Badge>
          </div>
          <p className="muted">
            공식적인 출제 비중이 아닙니다. 직무 역량과 공개 자료를 바탕으로 한
            학습 권장치입니다.
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
                      근거 유형: {r.evidence} · 평점 검증:{" "}
                      {r.lastVerified || "미검증"} · 적용 직무:{" "}
                      {r.applicableRoles
                        .map((id) => roles.find((r) => r.id === id)?.name)
                        .join(", ")}
                    </p>
                    {r.sourceUrl && (
                      <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                        추론에 참고한 자료 <ExternalLink size={13} />
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
              <h2>면접 절차</h2>
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
            <h3>우선순위를 정하세요</h3>
            <p>
              {Array.isArray(c.priority) ? c.priority.join(" ") : c.priority}
            </p>
            <h3>과도하게 집중하지 않을 것</h3>
            <p>{Array.isArray(c.avoid) ? c.avoid.join(" ") : c.avoid}</p>
            <Link to="practice">
              맞춤 연습 구성하기 <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </div>
      <section className="panel section-spaced">
        <h2>직무별 준비 기준</h2>
        <p className="muted">{p?.expectationsNote}</p>
        <div className="expectations-grid">
          {Object.entries(p?.expectations || {}).map(([key, text]) => (
            <div key={key}>
              <h3>
                {
                  {
                    math: "수학",
                    ml: "ML",
                    coding: "알고리즘 코딩",
                    mlcoding: "ML 구현",
                    research: "연구",
                    systems: "시스템",
                  }[key]
                }
              </h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel section-spaced">
        <h2>연결된 연습 질문</h2>
        <p className="muted">
          회사 관련성이 있는 자체 제작 문제입니다. 실제 기출로 표시하지
          않습니다.
        </p>
        {questions
          .filter((q) => q.companies.includes(id) && q.roles.includes(role))
          .slice(0, 6)
          .map((q) => (
            <QuestionRow key={q.id} q={q} />
          ))}
      </section>
      <section className="panel section-spaced">
        <h2>출처 · 근거</h2>
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
        title="회사 × 직무 비교"
        description="숫자는 준비 방향을 위한 권장치입니다. 근거가 부족한 차이는 억지로 만들지 않았습니다."
      />
      <div className="panel compare-controls">
        <Select
          label="비교할 직무"
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
        모든 수치: INFERRED · 직무 기준의 학습 우선순위. 각 셀을 열어
        confidence, 적용 직무, 출처, 검증일을 확인하세요.
      </div>
      <div className="panel table-scroll">
        <table className="comparison">
          <caption>
            {roles.find((r) => r.id === role)?.name} — 학습 우선순위 (1–5)
          </caption>
          <thead>
            <tr>
              <th scope="col">역량</th>
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
                                <small>{r.confidence} · 추론</small>
                              </summary>
                              <div className="cell-detail">
                                <p>{r.reason}</p>
                                <p>
                                  {r.evidence} ·{" "}
                                  {r.lastVerified || "평점 미검증"}
                                </p>
                                <p>적용: {r.applicableRoles.join(", ")}</p>
                                {r.sourceUrl && (
                                  <a
                                    href={r.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    참고 출처 ↗
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
          label="목표 직무"
          value={settings.role}
          onChange={(v) => set("role", v)}
          options={roles.map((r) => [r.id, r.name])}
        />
        <Select
          label="학습 시간"
          value={settings.minutes}
          onChange={(v) => set("minutes", Number(v))}
          options={[
            [30, "30분"],
            [45, "45분"],
            [60, "60분"],
            [90, "90분"],
          ]}
        />
        <Select
          label="도전 난이도"
          value={settings.difficulty}
          onChange={(v) => set("difficulty", Number(v))}
          options={[
            [1, "1 — 기초"],
            [2, "2 — 쉬움"],
            [3, "3 — 중간"],
            [4, "4 — 어려움"],
            [5, "5 — 연구 수준"],
          ]}
        />
        <label className="field">
          면접 예정일
          <input
            type="date"
            value={settings.interviewDate}
            onChange={(e) => set("interviewDate", e.target.value)}
          />
        </label>
      </div>
      <fieldset>
        <legend>
          목표 회사 <small>복수 선택 가능</small>
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
      <Details title={`취약 영역 직접 지정 (${settings.weak.length}개)`}>
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
      toast("목표 회사를 하나 이상 선택하세요.");
      return;
    }
    const p = generatePlan(questions, topics, profiles, { ...state, settings });
    update((s) => ({ ...s, settings, plan: p }));
    setShowConfig(false);
    setActive(null);
    toast("오늘의 연습 계획을 구성했습니다.");
  };
  const current = questions.find((q) => q.id === active);
  return (
    <>
      <PageHead
        eyebrow="DELIBERATE PRACTICE"
        title="오늘은 무엇을 연습할까요?"
        description="복습 시점, 취약 영역, 직무 관련성과 최근 연습을 함께 반영합니다."
        action={
          <Button secondary small onClick={() => setShowConfig(!showConfig)}>
            <Settings size={15} /> 계획 설정
          </Button>
        }
      />
      {showConfig && (
        <section className="panel section-spaced">
          <TargetForm settings={settings} onChange={setSettings} />
          <Button onClick={build}>
            맞춤 연습 만들기 <ArrowRight size={16} />
          </Button>
        </section>
      )}
      {plan && (
        <>
          <div className="session-summary">
            <div>
              <span className="eyebrow">YOUR PRACTICE SESSION</span>
              <h2>{plan.budget}분의 집중</h2>
              <p>
                {plan.items.length}개 질문 · {plan.budget - plan.remaining}분
                풀이
                {plan.remaining > 0 &&
                  ` + ${plan.remaining}분 구두 설명 · 오답 정리`}
              </p>
            </div>
            <div>
              <Badge tone="green">
                {
                  plan.items.filter(
                    (i) => state.reviews[i.id]?.lastReviewed >= plan.created,
                  ).length
                }{" "}
                / {plan.items.length} 평가 완료
              </Badge>
              <Button secondary small onClick={build}>
                현재 상태로 재구성 <RotateCcw size={14} />
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
                        {categories[item.category]} · {item.minutes}분
                      </small>
                      <h3>{q.title}</h3>
                      <p>{item.reason}</p>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
              <div className="panel-note">
                기초가 낯설다면 연결된 학습 페이지를 먼저 확인하세요. 질문
                풀이와 구두 설명을 번갈아 연습합니다.
              </div>
            </section>
            <div>
              {current ? (
                <QuestionCard q={current} key={current.id} />
              ) : (
                <div className="panel start-session">
                  <Play size={35} />
                  <h2>생각할 준비가 되셨나요?</h2>
                  <p>
                    노트를 닫고 첫 질문부터 시작하세요.
                    <br />
                    막히면 힌트를 사용하고, 답안을 확인한 뒤 평가하세요.
                  </p>
                  {plan.items[0] && (
                    <Button onClick={() => setActive(plan.items[0].id)}>
                      첫 질문 시작 <ArrowRight size={16} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {!plan && !showConfig && <Empty title="계획을 만들어 주세요" />}
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
      toast("시간이 종료되어 모의면접을 마쳤습니다. 답변을 검토해 주세요.");
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
        "선택한 조건의 질문이 없습니다. 시간을 늘리거나 범위를 바꿔 주세요.",
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
          title="모의면접 회고"
          description="작성한 답변을 해설·체크리스트와 비교하고 평가하세요. 점수는 자기 평가 요약입니다."
          action={
            <Button
              secondary
              onClick={() => {
                update((s) => ({ ...s, mock: null }));
                setConfirm(false);
              }}
            >
              새 모의면접
            </Button>
          }
        />
        <div className="stats-grid">
          <div className="stat">
            <span>자기 평가 점수</span>
            <strong>{score === null ? "—" : score + "%"}</strong>
            <small>
              {rated.length} / {mock.ids.length}개 평가
            </small>
          </div>
          <div className="stat">
            <span>잘 설명한 질문</span>
            <strong>{strong.length}</strong>
            <small>Good 또는 Easy</small>
          </div>
          <div className="stat">
            <span>보완할 질문</span>
            <strong>{weak.length}</strong>
            <small>Again 또는 Hard</small>
          </div>
          <div className="stat">
            <span>사용한 시간</span>
            <strong>
              {Math.min(
                mock.duration,
                Math.ceil((mock.completedAt - mock.start) / 60000),
              )}
              분
            </strong>
            <small>설정 시간 {mock.duration}분</small>
          </div>
        </div>
        <div className="notice">
          확신도와 실제 답변을 비교하세요. 건너뛴 질문도 검토 대상입니다. 아래
          평가는 복습 일정에도 반영됩니다.
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
                  {mock.ratings[id] || "미평가"} · 확신{" "}
                  {mock.confidence[id] || "—"}/4
                </Badge>
                <Plus size={16} />
              </summary>
              <div className="mock-answer">
                <h3>면접에서 작성한 답변</h3>
                <pre>{mock.answers[id] || "(답변하지 않음)"}</pre>
                <h3>핵심 답변</h3>
                <p>{item.shortAnswer}</p>
                <p>{item.intuition}</p>
                <Details title="수식 · 코드 · 검토 기준">
                  <div className="math-text">{item.derivation}</div>
                  {item.implementation && <Code value={item.implementation} />}
                  <ul>
                    {item.rubric?.map((r, j) => (
                      <li key={j}>{r}</li>
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
          <h2>다음 연습 제안</h2>
          {strong.length > 0 && (
            <>
              <h3>잘 설명한 영역</h3>
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
          <h3>보완할 영역</h3>
          {weak.length ? (
            <>
              <p>
                보완할 질문과 연결된 개념을 복습하고, 답안을 보지 않고 다시
                설명해 보세요.
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
            <p>먼저 각 질문을 평가하면 취약 개념이 표시됩니다.</p>
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
            다음 연습 구성 <ArrowRight size={16} />
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
            면접 종료
          </Button>
        </div>
        {confirm && (
          <div className="notice">
            <span>지금 마치고 답변을 검토하시겠어요?</span>
            <Button
              small
              onClick={() =>
                update((s) => ({
                  ...s,
                  mock: { ...s.mock, completed: true, completedAt: Date.now() },
                }))
              }
            >
              종료 · 회고
            </Button>
            <Button secondary small onClick={() => setConfirm(false)}>
              계속 풀기
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
          <div className="question-prompt">{q.question}</div>
          <label className="field">
            면접 답변 · 코드
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
              placeholder="가정과 사고 과정을 면접관에게 설명하듯 작성하세요."
            />
          </label>
          {mock.allowHints && (
            <Details title="힌트 보기">
              <p>{q.hints[0]}</p>
            </Details>
          )}
          <Select
            label="답변 확신도"
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
              ["", "선택"],
              ["1", "1 — 모름"],
              ["2", "2 — 불확실"],
              ["3", "3 — 대체로 확신"],
              ["4", "4 — 충분히 설명 가능"],
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
              이전 질문
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
                ? "다음 / 건너뛰기"
                : "면접 마치기"}{" "}
              <ArrowRight size={16} />
            </Button>
          </div>
          <p className="muted">
            응답과 타이머는 자동 저장됩니다. 탭을 닫아도 면접 시간은 계속
            흐릅니다. 해설은 종료 후 공개됩니다.
          </p>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHead
        eyebrow="THINK UNDER REAL CONSTRAINTS"
        title="모의면접"
        description="시간 안에 생각을 구조화하고, 근거를 설명하는 연습. 해설은 면접을 마친 뒤 열립니다."
      />
      <div className="mock-setup">
        <section className="panel">
          <h2>나만의 면접 구성</h2>
          <div className="form-grid">
            <Select
              label="목표 회사"
              value={company}
              onChange={setCompany}
              options={companies.map((c) => [c.id, c.name])}
            />
            <Select
              label="지원 직무"
              value={role}
              onChange={setRole}
              options={roles.map((r) => [r.id, r.name])}
            />
            <Select
              label="면접 시간"
              value={duration}
              onChange={setDuration}
              options={[
                [30, "30분"],
                [45, "45분"],
                [60, "60분"],
                [90, "90분"],
              ]}
            />
            <Select
              label="목표 난이도"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                [1, "기초"],
                [2, "쉬움"],
                [3, "중간"],
                [4, "어려움"],
                [5, "연구 수준"],
              ]}
            />
            <Select
              label="집중 영역"
              value={focus}
              onChange={setFocus}
              options={[
                ["all", "직무별 혼합 면접"],
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
            연습용 힌트 허용
          </label>
          <Button onClick={start}>
            <Mic size={17} /> 모의면접 시작
          </Button>
        </section>
        <div className="mock-intro">
          <span className="large-symbol">∴</span>
          <h2>
            답보다 중요한 건<br />
            답에 이르는 과정.
          </h2>
          <p>
            문제를 명확히 정의하세요.
            <br />
            가정을 밝히고, 작은 예제로 검증하세요.
            <br />
            막혀도 생각의 과정을 설명하세요.
          </p>
          <div className="notice">
            자체 구성한 연습 면접입니다. 특정 회사의 실제 면접 형식을 재현하거나
            자동으로 합격 가능성을 평가하지 않습니다.
          </div>
        </div>
      </div>
    </>
  );
}
function Review() {
  const { state, due, questions, topics, update } = useApp();
  const [tab, setTab] = useState("due"),
    [active, setActive] = useState(null),
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
        title="다시 꺼내볼 시간"
        description="잊기 전에 짧게 회상하고, 틀린 이유를 다음 문제의 단서로 남기세요."
      />
      <div className="tabs">
        {[
          ["due", `오늘의 복습 ${due.length}`],
          ["schedule", "복습 일정"],
          ["mistakes", `오답 노트 ${state.mistakes.length}`],
        ].map(([id, name]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              setActive(null);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "due" ? (
        active ? (
          <>
            <Button secondary small onClick={() => setActive(null)}>
              복습 목록으로
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
                      {formatDate(state.reviews[q.id].nextReview)} 복습 예정 ·{" "}
                      {state.reviews[q.id].reviewCount}회 평가
                    </small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))
            ) : (
              <Empty
                title="지금 예정된 복습은 없습니다"
                action={
                  <Link className="button" to="practice">
                    새로운 질문 연습 <ArrowRight size={15} />
                  </Link>
                }
              >
                질문을 풀고 Again / Hard / Good / Easy로 평가하면 복습 일정이
                생깁니다.
              </Empty>
            )}
          </div>
        )
      ) : tab === "schedule" ? (
        <div className="panel">
          {scheduled.length ? (
            scheduled.map((q) => (
              <Link className="simple-row" key={q.id} to={"questions/" + q.id}>
                <div>
                  <h3>{q.title}</h3>
                  <small>
                    {state.reviews[q.id].reviewCount}회 평가 · 숙련도{" "}
                    {effectiveMastery(state.reviews[q.id])}%
                  </small>
                </div>
                <span>
                  {new Date(state.reviews[q.id].nextReview).toLocaleString(
                    "ko-KR",
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
            <Empty title="예약된 복습이 없습니다" />
          )}
        </div>
      ) : (
        <>
          <div className="panel mistake-summary">
            <h2>반복되는 오답 패턴</h2>
            <div className="tags">
              {Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id, n]) => (
                  <button
                    className="tag"
                    key={id}
                    onClick={() => setFilter(id)}
                  >
                    {topics.find((t) => t.id === id)?.title} · {n}회
                  </button>
                ))}
            </div>
            <Select
              label="주제로 필터"
              value={filter}
              onChange={setFilter}
              options={[
                ["all", "모든 오답"],
                ...topics
                  .filter((t) => counts[t.id])
                  .map((t) => [t.id, t.title]),
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
                      aria-label="오답 삭제"
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
                      ["thought", "내가 생각했던 것"],
                      ["why", "왜 틀렸는지"],
                      ["principle", "올바른 원리"],
                      ["signal", "다음에 알아볼 단서"],
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
            <Empty title="실수를 학습의 단서로 바꿔보세요">
              질문 해설 아래에서 오답 노트를 작성할 수 있습니다.
            </Empty>
          )}
        </>
      )}
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
        throw new Error("10MB 이하 백업을 선택해 주세요.");
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
      setImportError(err.message || "파일을 읽을 수 없습니다.");
    }
    e.target.value = "";
  };
  return (
    <>
      <PageHead
        eyebrow="MEASURE WHAT YOU CAN EXPLAIN"
        title="얼마나 깊이 이해하고 있나요?"
        description="회상과 풀이의 자기 평가를 추적합니다. 합격 확률이나 자동 채점 결과가 아닙니다."
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
              <Download size={15} /> 백업
            </Button>
            <Button secondary small onClick={() => input.current.click()}>
              <Upload size={15} /> 복원
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
            복원할 기록: 평가 {Object.keys(pending.reviews).length}개, 오답{" "}
            {pending.mistakes.length}개. 현재 기록을 대체합니다. 먼저 백업을
            권장합니다.
          </span>
          <Button
            small
            onClick={() => {
              update(pending);
              setPending(null);
              toast("백업을 복원했습니다.");
            }}
          >
            복원 적용
          </Button>
          <Button small secondary onClick={() => setPending(null)}>
            취소
          </Button>
        </div>
      )}
      <div className="stats-grid">
        {[
          [
            "전체 숙련도",
            Math.round(total / questions.length) + "%",
            "미평가 포함 · 시간 경과 반영",
          ],
          [
            "평가한 질문",
            practiced.length + "/" + questions.length,
            "페이지 방문 수와 무관",
          ],
          ["안정된 회상", mastered.length, "유효 숙련도 80% 이상"],
          ["누적 회상 연습", state.history.length, "자기 평가를 완료한 횟수"],
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
            <h2>영역별 숙련도</h2>
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
          <Details title="숙련도는 어떻게 계산하나요?">
            <p>
              Again은 현재 점수에서 25점을 낮추고, Hard / Good / Easy는 각각 8 /
              20 / 30점을 더합니다(0–100). 복습 기한을 넘기면 점수가 점진적으로
              감소합니다. 영역 점수는 해당 질문의 평균이며 미평가 질문은
              0점입니다. 자기 평가의 한계가 있으므로 해설과 체크리스트를 함께
              사용하세요.
            </p>
          </Details>
        </section>
        <section className="panel">
          <span className="eyebrow">CONSISTENCY COMPOUNDS</span>
          <h2>지난 12주의 연습</h2>
          <div className="heatmap" aria-label="일별 평가 횟수">
            {days.map((day) => (
              <span
                key={day}
                title={`${day}: ${counts[day] || 0}회`}
                aria-label={`${day}: ${counts[day] || 0}회`}
                className={
                  "level-" + Math.min(4, Math.ceil((counts[day] || 0) / 2))
                }
              />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>12주 전</span>
            <span>오늘 · 옅음 0 → 진함 7회 이상</span>
          </div>
          <h3>다음에 집중할 개념</h3>
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
          <h2>나의 답변 보관함</h2>
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
            <Download size={14} /> 답변 내보내기
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
                <small>{v.length}자</small>
              </Link>
            ))
        ) : (
          <p className="muted">질문에 작성한 풀이가 여기에 모입니다.</p>
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
        title="나의 학습 목표"
        description="설정은 오늘의 계획과 회사 관련성, 추천 질문에 함께 반영됩니다."
      />
      <section className="panel">
        <TargetForm settings={settings} onChange={setSettings} />
        <Button
          onClick={() => {
            if (!settings.companies.length) {
              toast("목표 회사를 하나 이상 선택해 주세요.");
              return;
            }
            update((s) => ({ ...s, settings, plan: null }));
            toast("학습 목표를 저장했습니다.");
          }}
        >
          설정 저장 <Check size={16} />
        </Button>
      </section>
      <div className="notice section-spaced">
        <ShieldCheck size={20} />
        <span>
          기록은 현재 브라우저의 localStorage에 저장됩니다. 계정이나 서버 동기화
          없이 사용할 수 있습니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전,
          진척도 페이지에서 백업해 주세요.
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
        title="다시 읽기보다, 다시 꺼내기."
        description="복습의 중심을 회상과 문제 해결에 두세요. 읽기는 처음 배우거나 혼란을 풀고 실수를 확인할 때 사용합니다."
      />
      <div className="guide-hero">
        <span className="eyebrow">YOUR DEFAULT STUDY LOOP</span>
        <h2>
          배우고. 닫고. 떠올리고.
          <br />
          풀고. 설명하고. 확인하기.
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
            "설명을 보기 전에 답하세요.",
            "식을 기억에서 쓰고, 코드가 어떤 결과를 낼지 예측하고, 60초 동안 설명하세요. 답이 떠오르지 않는 순간도 학습할 지점을 알려줍니다.",
          ],
          [
            "02",
            "Spaced repetition",
            "익숙해진 뒤에도 간격을 두세요.",
            "Again은 10분 뒤, 나머지 평가는 기존 간격과 난이도에 따라 복습을 예약합니다. 너무 쉽게 읽히는 해설을 반복해서 보는 대신 답을 다시 만들어 보세요.",
          ],
          [
            "03",
            "Interleaving",
            "기초가 잡히면 유형을 섞으세요.",
            "처음에는 예제를 따라 배우고, 이후 수학·ML·코딩·연구 질문을 번갈아 풉니다. 어떤 원리를 써야 하는지 구별하는 연습입니다.",
          ],
          [
            "04",
            "Worked → independent",
            "도움을 점차 줄이세요.",
            "어려운 수식은 예제 한 개를 읽고, 비슷한 문제를 힌트와 함께 푼 뒤, 다른 문제를 독립적으로 풀어보세요. 마지막에는 풀이를 말로 설명합니다.",
          ],
          [
            "05",
            "Error log",
            "틀린 답보다 틀린 이유를 기록하세요.",
            "“Bayes를 틀림”보다 “P(A|B)와 P(B|A)를 바꾸어 썼음”이 유용합니다. 다음 문제에서 알아볼 수 있는 신호를 남기세요.",
          ],
          [
            "06",
            "Explain out loud",
            "면접 답변은 전달하는 연습입니다.",
            "30초에는 핵심, 60초에는 직관과 가정, 깊은 설명에는 수식·코드·트레이드오프를 담으세요. 일단 말한 뒤 해설과 비교합니다.",
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
          <h2>오늘 확보한 시간에 맞추세요</h2>
          <Link to="practice">
            나의 계획 만들기 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="session-grid">
          {[
            [
              30,
              [
                ["간격 복습", 5],
                ["수학 · ML", 10],
                ["코딩", 10],
                ["구두 설명", 5],
              ],
            ],
            [
              60,
              [
                ["간격 복습", 10],
                ["수학 · 이론", 15],
                ["코딩 · 구현", 15],
                ["새로운 개념", 10],
                ["연구 · 구두 설명", 10],
              ],
            ],
            [
              90,
              [
                ["간격 회상", 15],
                ["수학", 20],
                ["ML · DL", 20],
                ["코딩", 20],
                ["연구 추론", 15],
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
                  <strong>{n}분</strong>
                </div>
              ))}
            </section>
          ))}
        </div>
        <p className="muted">
          위 시간표는 예시입니다. 실제 추천은 취약점, 목표 회사·직무, 면접일,
          복습 일정과 문제 소요 시간을 반영해 조정됩니다.
        </p>
      </section>
      <section className="panel section-spaced">
        <h2>한 개념을 다섯 단계로</h2>
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
        <h3>예: Softmax + Cross Entropy</h3>
        <ol>
          <li>Softmax가 하는 일을 수식 없이 설명하세요.</li>
          <li>교차 엔트로피의 logits 미분을 유도하세요.</li>
          <li>최댓값을 빼는 안정적인 softmax를 구현하세요.</li>
          <li>큰 logits에서 overflow가 나는 코드를 고치세요.</li>
          <li>같은 상수를 빼도 확률이 같은 이유를 증명하세요.</li>
        </ol>
        <TopicLinks ids={["ml-code-softmax", "information"]} />
      </section>
      <section className="panel section-spaced">
        <h2>학습 원칙의 근거</h2>
        <p>
          인출 연습과 분산 학습은 장기 기억에 도움이 된다는 연구를 바탕으로
          합니다. 개별 학습자의 효과와 최적 간격은 달라지며, 이 앱의 스케줄러
          자체가 임상적·교육적으로 검증된 알고리즘이라는 뜻은 아닙니다.
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
          <h1>화면을 불러오지 못했습니다.</h1>
          <p>
            기록은 브라우저에 남아 있습니다. 새로고침 후 다시 시도해 주세요.
          </p>
          <button onClick={() => location.reload()}>새로고침</button>
          <button
            onClick={() =>
              downloadFile(
                "research-practice-recovery.json",
                localStorage.getItem(KEY) || "{}",
              )
            }
          >
            기록 백업
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
      <p>학습 공간을 준비하고 있습니다…</p>
    </div>,
  );
  try {
    const [topics, questions, companyData] = await Promise.all(
      ["curriculum", "questions", "companies"].map(async (name) => {
        const r = await fetch(
          import.meta.env.BASE_URL + "data/" + name + ".json",
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
        <h1>학습 자료를 불러올 수 없습니다.</h1>
        <p>네트워크 연결을 확인하고 다시 시도해 주세요.</p>
        <button onClick={() => location.reload()}>다시 불러오기</button>
      </div>,
    );
  }
}
boot();
