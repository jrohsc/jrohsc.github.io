export const DAY = 86400000;
export const categories = {
  math: "수학 기초",
  ml: "머신러닝",
  dl: "딥러닝",
  llm: "LLM · Modern AI",
  dsa: "알고리즘 · DSA",
  mlcoding: "ML 구현",
  systems: "ML 시스템",
  research: "연구 역량",
  domain: "선택 도메인",
};
export const typeNames = {
  conceptual: "개념 설명",
  derivation: "수식 유도",
  probability: "확률",
  reasoning: "증명 · 추론",
  coding: "알고리즘 코딩",
  implementation: "ML 구현",
  debugging: "디버깅",
  research: "연구 설계",
  system: "시스템 설계",
  critique: "논문 비평",
  estimation: "자원 추정",
  experiment: "실험 추론",
};
export const defaultState = () => ({
  version: 1,
  settings: {
    companies: ["deepmind", "openai", "anthropic"],
    role: "rs",
    minutes: 60,
    interviewDate: "",
    weak: [],
    difficulty: 3,
  },
  reviews: {},
  mistakes: [],
  drafts: {},
  bookmarks: [],
  history: [],
  mock: null,
  plan: null,
});
export function schedule(previous, rating, now = Date.now()) {
  if (!["again", "hard", "good", "easy"].includes(rating))
    throw new Error("Invalid rating");
  const p = previous || {
    interval: 0,
    ease: 2.3,
    reviewCount: 0,
    mastery: 0,
    history: [],
  };
  const ease = Math.max(
    1.3,
    Math.min(
      3,
      (p.ease || 2.3) +
        { again: -0.2, hard: -0.15, good: 0, easy: 0.15 }[rating],
    ),
  );
  const interval =
    rating === "again"
      ? 10 / 1440
      : rating === "hard"
        ? Math.max(1, (p.interval || 0.5) * 1.2)
        : rating === "good"
          ? Math.max(2, (p.interval || 1) * ease)
          : Math.max(4, (p.interval || 1) * ease * 1.3);
  const mastery =
    rating === "again"
      ? Math.max(0, (p.mastery || 0) - 25)
      : Math.min(
          100,
          (p.mastery || 0) + { hard: 8, good: 20, easy: 30 }[rating],
        );
  return {
    ...p,
    ease,
    interval,
    lastReviewed: now,
    nextReview: now + interval * DAY,
    reviewCount: (p.reviewCount || 0) + 1,
    mastery,
    history: [...(p.history || []), { at: now, rating, interval }].slice(-100),
  };
}
export function effectiveMastery(r, now = Date.now()) {
  if (!r) return 0;
  return Math.round(
    r.mastery *
      Math.exp(
        -Math.max(0, now - r.nextReview) / DAY / Math.max(3, r.interval * 2),
      ),
  );
}
export function topicMastery(id, questions, reviews, now = Date.now()) {
  const qs = questions.filter((q) => q.topics.includes(id));
  return qs.length
    ? Math.round(
        qs.reduce((s, q) => s + effectiveMastery(reviews[q.id], now), 0) /
          qs.length,
      )
    : 0;
}
export function categoryMastery(cat, topics, questions, reviews) {
  const ids = topics.filter((t) => t.category === cat).map((t) => t.id);
  const qs = questions.filter((q) => q.topics.some((t) => ids.includes(t)));
  return qs.length
    ? Math.round(
        qs.reduce((s, q) => s + effectiveMastery(reviews[q.id]), 0) / qs.length,
      )
    : 0;
}
export function rankQuestions(
  questions,
  topics,
  profiles,
  state,
  options = {},
) {
  const now = options.now || Date.now(),
    settings = { ...state.settings, ...options };
  const tmap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const targetProfiles = profiles.filter(
    (p) =>
      settings.companies.includes(p.companyId) && p.roleId === settings.role,
  );
  return questions
    .filter(
      (q) =>
        !options.focus ||
        options.focus === "all" ||
        q.topics.some((id) => tmap[id]?.category === options.focus),
    )
    .map((q) => {
      const r = state.reviews[q.id],
        category = tmap[q.topics[0]]?.category || "ml";
      const importance = targetProfiles.length
        ? targetProfiles.reduce(
            (s, p) =>
              s +
              (p.ratings.find((x) => x.dimensionId === category)?.importance ||
                3),
            0,
          ) / targetProfiles.length
        : 3;
      const due =
        r && r.nextReview <= now
          ? 10 + Math.min(5, (now - r.nextReview) / DAY)
          : 0;
      const weakness = q.topics.some((id) => settings.weak.includes(id))
        ? 5
        : 0;
      const recent = r ? Math.max(0, 1 - (now - r.lastReviewed) / DAY) * 8 : 0;
      const relevance = q.companies.some((id) =>
        settings.companies.includes(id),
      )
        ? 2
        : 0;
      const role = q.roles.includes(settings.role) ? 3 : -3;
      const difficulty =
        3 - Math.abs(q.difficulty - Number(settings.difficulty || 3));
      const coverage = r ? 0 : 2;
      const days = settings.interviewDate
        ? Math.max(
            0,
            (new Date(settings.interviewDate + "T12:00:00").getTime() - now) /
              DAY,
          )
        : 60;
      const deadline = days < 8 ? importance * 1.5 : 0;
      const score =
        due +
        weakness +
        role +
        relevance +
        importance +
        q.importance * 0.7 +
        (100 - effectiveMastery(r, now)) / 20 +
        difficulty +
        coverage -
        recent +
        deadline;
      return {
        q,
        score,
        category,
        reason: due
          ? "복습 예정일 도래"
          : weakness
            ? "선택한 취약 영역"
            : !r
              ? "아직 평가하지 않은 개념"
              : "직무 중요도 · 숙련도 반영",
      };
    })
    .sort((a, b) => b.score - a.score || a.q.id.localeCompare(b.q.id));
}
export function generatePlan(questions, topics, profiles, state, options = {}) {
  const budget = Number(options.minutes || state.settings.minutes),
    ranked = rankQuestions(questions, topics, profiles, state, options),
    selected = [],
    used = new Set();
  let remaining = budget,
    last = "";
  while (remaining >= 3) {
    const candidates = ranked
      .filter((x) => !used.has(x.q.id) && x.q.expectedTime <= remaining)
      .map((x) => ({
        ...x,
        adjusted:
          x.score -
          selected.filter((s) => s.category === x.category).length * 4 -
          (x.category === last ? 3 : 0),
      }))
      .sort((a, b) => b.adjusted - a.adjusted || a.q.id.localeCompare(b.q.id));
    const pick = candidates[0];
    if (!pick) break;
    selected.push({
      id: pick.q.id,
      minutes: pick.q.expectedTime,
      reason: pick.reason,
      category: pick.category,
    });
    remaining -= pick.q.expectedTime;
    used.add(pick.q.id);
    last = pick.category;
  }
  return {
    created: Date.now(),
    budget,
    remaining,
    items: selected,
    settings: { ...state.settings, ...options },
  };
}
export function validateImport(
  x,
  questionIds,
  topicIds,
  companyIds,
  roleIds = ["rs", "re", "mle", "as", "swe"],
) {
  if (
    !x ||
    x.version !== 1 ||
    !x.settings ||
    !Array.isArray(x.history) ||
    !Array.isArray(x.mistakes) ||
    !Array.isArray(x.bookmarks) ||
    typeof x.reviews !== "object" ||
    !x.reviews ||
    Array.isArray(x.reviews)
  )
    throw new Error("지원하지 않는 백업 형식입니다.");
  const s = x.settings;
  if (
    !roleIds.includes(s.role) ||
    !Array.isArray(s.companies) ||
    !s.companies.every((id) => companyIds.includes(id)) ||
    ![30, 45, 60, 90].includes(Number(s.minutes)) ||
    !Array.isArray(s.weak) ||
    !s.weak.every((id) => topicIds.includes(id)) ||
    !Number.isFinite(s.difficulty) ||
    s.difficulty < 1 ||
    s.difficulty > 5 ||
    typeof s.interviewDate !== "string" ||
    (s.interviewDate && !/^\d{4}-\d{2}-\d{2}$/.test(s.interviewDate))
  )
    throw new Error("설정 데이터가 올바르지 않습니다.");
  for (const [id, r] of Object.entries(x.reviews)) {
    if (
      !questionIds.includes(id) ||
      !r ||
      ![
        "mastery",
        "interval",
        "ease",
        "reviewCount",
        "lastReviewed",
        "nextReview",
      ].every((k) => Number.isFinite(r[k])) ||
      r.mastery < 0 ||
      r.mastery > 100 ||
      r.interval < 0 ||
      r.reviewCount < 0 ||
      !Array.isArray(r.history) ||
      r.history.some(
        (h) =>
          !h ||
          !Number.isFinite(h.at) ||
          !["again", "hard", "good", "easy"].includes(h.rating),
      )
    )
      throw new Error("복습 데이터가 올바르지 않습니다.");
  }
  if (
    x.bookmarks.some((id) => !questionIds.includes(id)) ||
    x.mistakes.some(
      (m) =>
        !m ||
        typeof m.id !== "string" ||
        !questionIds.includes(m.questionId) ||
        !Number.isFinite(m.at) ||
        !["thought", "why", "principle", "signal"].every(
          (k) => typeof m[k] === "string",
        ),
    ) ||
    x.history.some(
      (h) =>
        !h ||
        !questionIds.includes(h.id) ||
        !Number.isFinite(h.at) ||
        !["again", "hard", "good", "easy"].includes(h.rating),
    )
  )
    throw new Error("학습 기록이 올바르지 않습니다.");
  const drafts =
    x.drafts && typeof x.drafts === "object" && !Array.isArray(x.drafts)
      ? Object.fromEntries(
          Object.entries(x.drafts).filter(
            ([k, v]) => questionIds.includes(k) && typeof v === "string",
          ),
        )
      : {};
  let mock = null,
    plan = null;
  if (x.mock) {
    const m = x.mock;
    const finite = (k) => Number.isFinite(m[k]);
    const object = (v) => v && typeof v === "object" && !Array.isArray(v);
    if (
      !Array.isArray(m.ids) ||
      !m.ids.length ||
      m.ids.some((id) => !questionIds.includes(id)) ||
      new Set(m.ids).size !== m.ids.length ||
      !companyIds.includes(m.company) ||
      !roleIds.includes(m.role) ||
      !["start", "end", "duration", "index"].every(finite) ||
      !Number.isInteger(m.index) ||
      m.index < 0 ||
      m.index >= m.ids.length ||
      m.duration < 1 ||
      m.duration > 180 ||
      m.end < m.start ||
      typeof m.completed !== "boolean" ||
      !object(m.answers) ||
      !object(m.ratings) ||
      !object(m.confidence) ||
      Object.entries(m.answers).some(
        ([id, v]) => !m.ids.includes(id) || typeof v !== "string",
      ) ||
      Object.entries(m.ratings).some(
        ([id, r]) =>
          !m.ids.includes(id) || !["again", "hard", "good", "easy"].includes(r),
      ) ||
      Object.entries(m.confidence).some(
        ([id, v]) =>
          !m.ids.includes(id) || !["", "1", "2", "3", "4"].includes(v),
      ) ||
      (m.completed && !Number.isFinite(m.completedAt))
    )
      throw new Error("모의면접 기록이 올바르지 않습니다.");
    mock = m;
  }
  if (x.plan) {
    const p = x.plan;
    if (
      !Array.isArray(p.items) ||
      p.items.some(
        (i) =>
          !i ||
          !questionIds.includes(i.id) ||
          !Number.isFinite(i.minutes) ||
          i.minutes <= 0 ||
          typeof i.reason !== "string" ||
          !Object.hasOwn(categories, i.category),
      ) ||
      !Number.isFinite(p.created) ||
      !Number.isFinite(p.budget) ||
      !Number.isFinite(p.remaining) ||
      p.remaining < 0 ||
      p.items.reduce((a, i) => a + i.minutes, 0) > p.budget
    )
      throw new Error("연습 계획이 올바르지 않습니다.");
    plan = p;
  }
  return {
    ...defaultState(),
    settings: s,
    reviews: x.reviews,
    mistakes: x.mistakes,
    history: x.history,
    bookmarks: x.bookmarks,
    drafts,
    mock,
    plan,
  };
}
export function isoDay(at = Date.now()) {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
