import test from "node:test";
import assert from "node:assert/strict";
import {
  schedule,
  effectiveMastery,
  generatePlan,
  rankQuestions,
  defaultState,
  validateImport,
  DAY,
} from "../src/engine.js";
const now = 1800000000000;
test("adaptive schedule orders ratings and relearns a lapse", () => {
  const p = {
    interval: 7,
    ease: 2.3,
    reviewCount: 4,
    mastery: 80,
    history: [],
  };
  const graded = ["again", "hard", "good", "easy"].map((r) =>
    schedule(p, r, now),
  );
  assert.ok(graded.every((r) => r.nextReview > now));
  assert.ok(
    graded[0].interval < graded[1].interval &&
      graded[1].interval < graded[2].interval &&
      graded[2].interval < graded[3].interval,
  );
  assert.equal(graded[0].nextReview, now + 600000);
  assert.equal(graded[0].mastery, 55);
  assert.equal(graded[3].mastery, 100);
  assert.equal(graded[0].history[0].rating, "again");
  assert.equal(graded[2].reviewCount, 5);
});
test("mastery decays only once overdue", () => {
  const r = schedule(null, "good", now);
  assert.equal(effectiveMastery(r, now), 20);
  assert.ok(effectiveMastery(r, r.nextReview + 10 * DAY) < 20);
  assert.equal(effectiveMastery(undefined), 0);
});
const topics = [
  { id: "math-topic", category: "math" },
  { id: "code-topic", category: "mlcoding" },
  { id: "ml-topic", category: "ml" },
];
const questions = Array.from({ length: 15 }, (_, i) => ({
  id: "q" + i,
  topics: [topics[i % 3].id],
  companies: ["deepmind"],
  roles: ["rs"],
  importance: 4,
  difficulty: 3,
  expectedTime: 10,
}));
const profiles = [
  {
    companyId: "deepmind",
    roleId: "rs",
    ratings: [
      { dimensionId: "math", importance: 5 },
      { dimensionId: "mlcoding", importance: 4 },
      { dimensionId: "ml", importance: 4 },
    ],
  },
];
test("plan respects budget, deduplicates and interleaves", () => {
  const s = defaultState(),
    p = generatePlan(questions, topics, profiles, s, { minutes: 60, now });
  assert.equal(p.items.length, 6);
  assert.equal(new Set(p.items.map((x) => x.id)).size, 6);
  assert.equal(
    p.items.reduce((n, x) => n + x.minutes, 0),
    60,
  );
  assert.ok(new Set(p.items.map((x) => x.category)).size >= 3);
  assert.equal(p.remaining, 0);
});
test("due reviews and explicit weakness affect ordering", () => {
  const s = defaultState();
  s.reviews.q10 = { ...schedule(null, "good", now - DAY * 10), mastery: 50 };
  const r = rankQuestions(questions, topics, profiles, s, { now });
  assert.equal(r[0].q.id, "q10");
  s.settings.weak = ["ml-topic"];
  const w = rankQuestions(questions, topics, profiles, s, { now });
  assert.ok(
    w.find((x) => x.q.id === "q2").score > w.find((x) => x.q.id === "q0").score,
  );
});
test("empty and too-small pools finish without overflow", () => {
  assert.equal(
    generatePlan([], topics, profiles, defaultState(), { minutes: 30 }).items
      .length,
    0,
  );
  assert.equal(
    generatePlan(questions, topics, profiles, defaultState(), { minutes: 7 })
      .remaining,
    7,
  );
});
test("review interval never goes negative under repeated lapses", () => {
  let r;
  for (let i = 0; i < 100; i++) r = schedule(r, "again", now + i * 600000);
  assert.ok(r.ease >= 1.3);
  assert.equal(r.mastery, 0);
  assert.equal(r.history.length, 100);
  assert.throws(() => schedule(r, "bad"));
});
test("backup validation accepts safe data and rejects broken references and scalars", () => {
  const s = defaultState();
  s.reviews.q0 = schedule(null, "good", now);
  const qs = questions.map((q) => q.id),
    ts = topics.map((t) => t.id),
    cs = ["deepmind", "openai", "anthropic"];
  assert.equal(validateImport(s, qs, ts, cs).reviews.q0.reviewCount, 1);
  assert.throws(() => validateImport({ ...s, version: 99 }, qs, ts, cs));
  assert.throws(() =>
    validateImport({ ...s, reviews: { unknown: s.reviews.q0 } }, qs, ts, cs),
  );
  assert.throws(() =>
    validateImport(
      { ...s, reviews: { q0: { ...s.reviews.q0, mastery: "100" } } },
      qs,
      ts,
      cs,
    ),
  );
  assert.throws(() =>
    validateImport(
      { ...s, settings: { ...s.settings, companies: ["unknown"] } },
      qs,
      ts,
      cs,
    ),
  );
});
