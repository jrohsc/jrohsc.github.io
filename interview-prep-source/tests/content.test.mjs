import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) =>
  JSON.parse(
    fs.readFileSync(
      new URL("../../interview-prep/data/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
const topics = read("curriculum"),
  qs = read("questions"),
  data = read("companies");
test("knowledge graph has unique IDs and valid edges", () => {
  const ids = new Set(topics.map((t) => t.id));
  assert.equal(ids.size, topics.length);
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length);
  for (const t of topics) {
    assert.ok(t.summary && t.intuition && t.math && t.derivation && t.code);
    for (const id of [...t.prerequisites, ...t.related])
      assert.ok(ids.has(id), id);
    assert.ok(
      qs.some((q) => q.topics.includes(t.id)),
      `no questions: ${t.id}`,
    );
  }
  for (const q of qs) {
    for (const id of [...q.topics, ...q.prerequisites])
      assert.ok(ids.has(id), id);
    assert.ok(q.hints.length >= 2 && q.rubric.length >= 3);
    assert.ok(q.shortAnswer && q.derivation && q.intuition);
    assert.ok(q.expectedTime > 0 && q.expectedTime <= 90);
    assert.ok(q.difficulty >= 1 && q.difficulty <= 5);
    for (const c of q.companies)
      assert.ok(data.companies.some((x) => x.id === c));
    for (const r of q.roles) assert.ok(data.roles.some((x) => x.id === r));
  }
});
test("all company roles expose evidence and honest uncertainty", () => {
  assert.ok(data.companies.length >= 10);
  assert.ok(data.roles.length >= 5);
  assert.equal(data.profiles.length, data.companies.length * data.roles.length);
  assert.equal(
    new Set(data.profiles.map((p) => p.companyId + ":" + p.roleId)).size,
    data.companies.length * data.roles.length,
  );
  for (const p of data.profiles) {
    assert.equal(p.ratings.length, data.dimensions.length);
    for (const r of p.ratings) {
      assert.ok(r.importance >= 1 && r.importance <= 5);
      assert.ok(["low", "medium", "high"].includes(r.confidence));
      assert.ok(
        ["INFERRED", "OFFICIAL", "CANDIDATE REPORTED"].includes(r.evidence),
      );
      assert.ok(Object.hasOwn(r, "lastVerified"));
      assert.ok(r.reason);
      assert.ok(r.applicableRoles.includes(p.roleId));
    }
  }
});
test("source links use HTTP(S), with no executable pseudo-URLs", () => {
  for (const t of [...topics, ...qs, ...data.companies])
    for (const s of t.sources) assert.ok(/^https?:\/\//.test(s.url));
  for (const d of data.dimensions)
    for (const id of d.topicIds) assert.ok(topics.some((t) => t.id === id));
});

test("every lesson explains its equations and all LaTeX renders strictly", async () => {
  const { default: katex } = await import("katex");
  const render = (value) =>
    katex.renderToString(value, {
      throwOnError: true,
      trust: false,
      strict: "error",
    });
  for (const t of topics) {
    assert.ok(t.formulas?.length, t.id);
    for (const f of t.formulas) {
      render(f.latex);
      assert.ok(f.explanation && f.example && f.symbols.length);
      for (const s of f.symbols) {
        render(s.symbol);
        assert.ok(s.meaning);
      }
    }
  }
  const walk = (value) => {
    if (typeof value === "string") {
      assert.ok(!/[가-힣]/.test(value));
      for (const m of value.matchAll(
        /\$\$([\s\S]+?)\$\$|\$(?!\$)([^$\n]+?)\$/g,
      ))
        render(m[1] || m[2]);
    } else if (value && typeof value === "object")
      Object.values(value).forEach(walk);
  };
  walk(topics);
  walk(qs);
  walk(data);
});
test("company mentions are source-backed and scoped independently of ratings", () => {
  assert.ok(data.topicMentions.length > 0);
  for (const m of data.topicMentions) {
    assert.ok(topics.some((t) => t.id === m.topicId));
    assert.ok(data.companies.some((c) => c.id === m.companyId));
    assert.equal(m.evidence, "OFFICIAL");
    assert.ok(
      ["ROLE_DESCRIPTION", "INTERVIEW_GUIDE", "RESEARCH_PUBLICATION"].includes(
        m.scope,
      ),
    );
    assert.ok(
      /^https:\/\//.test(m.url) && m.sourceTitle && m.summary && m.lastVerified,
    );
  }
});
