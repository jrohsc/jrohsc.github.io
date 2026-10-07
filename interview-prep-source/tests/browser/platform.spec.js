import { test, expect } from "@playwright/test";
const home = "/interview-prep/";
test("all primary pages render and curriculum filters and interactive diagrams work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(home);
  await expect(
    page.getByRole("heading", {
      name: "A little practice. A deeper understanding.",
    }),
  ).toBeVisible();
  for (const [route, title] of [
    ["study", "Build connected AI / ML knowledge"],
    ["questions", "Question explorer"],
    ["companies", "Prepare for the role, not just the company."],
    ["practice", "What will you practice today?"],
    ["mock", "Mock interview"],
    ["review", "Time to bring it back"],
    ["progress", "How deeply do you understand it?"],
    ["guide", "Retrieve more. Reread less."],
  ]) {
    await page.goto(home + "#/" + route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.goto(home + "#/study?category=math");
  await expect(page.locator(".topic-card")).toHaveCount(10);
  await page.goto(home + "#/study/spectral");
  await page
    .getByRole("button", { name: "Visual explanation", exact: true })
    .click();
  await expect(page.locator(".diagram svg")).toBeVisible();
  await page.locator("input[type=range]").fill("70");
  await expect(page.locator(".range-label strong")).toHaveText("70");
  await page.goto(home + "#/questions");
  await page.getByRole("textbox", { name: "Search questions" }).fill("softmax");
  await expect(page.locator(".question-row").first()).toBeVisible();
  expect(errors).toEqual([]);
});
test("recall hides answers, saves drafts, grades, records mistakes and preserves reload", async ({
  page,
}) => {
  await page.goto(home + "#/questions/orthogonal-projection");
  await expect(page.locator(".solution")).toHaveCount(0);
  await page
    .getByLabel("Your answer / working")
    .fill("The residual is orthogonal to the column space.");
  await page.getByRole("button", { name: "Hint 1", exact: true }).click();
  await expect(page.locator(".hint-box")).toContainText("residual");
  await page.getByRole("button", { name: "Show Solution" }).click();
  await expect(page.locator(".solution-lead")).toBeVisible();
  await page.getByRole("button", { name: /Again Relearn/ }).click();
  await page.getByLabel("What I thought").fill("The inverse always exists");
  await page.getByLabel("Why it was wrong").fill("Columns can be dependent");
  await page.getByLabel("Correct principle").fill("Check the rank");
  await page
    .getByLabel("How I will recognize it next time")
    .fill("Check shapes and the SVD");
  await page.getByRole("button", { name: "Save mistake" }).click();
  await page.reload();
  await expect(page.getByLabel("Your answer / working")).toHaveValue(
    "The residual is orthogonal to the column space.",
  );
  await expect(page.locator(".solution")).toHaveCount(0);
  await page.goto(home + "#/review");
  await page
    .getByRole("button", { name: "Mistake notebook", exact: true })
    .click();
  await expect(page.locator(".mistake-entry")).toContainText("Check the rank");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("research-practice:v1")),
  );
  expect(saved.reviews["orthogonal-projection"].reviewCount).toBe(1);
  expect(
    saved.reviews["orthogonal-projection"].nextReview -
      saved.reviews["orthogonal-projection"].lastReviewed,
  ).toBe(600000);
});
test("company-role comparison changes and evidence is inspectable", async ({
  page,
}) => {
  await page.goto(home + "#/compare");
  await expect(page.locator("table")).toBeVisible();
  const before = await page.locator("tbody").textContent();
  await page.getByLabel("Role to compare").selectOption("mle");
  const after = await page.locator("tbody").textContent();
  expect(after).not.toBe(before);
  await page.locator("td summary").first().click();
  await expect(page.locator(".cell-detail").first()).toBeVisible();
  await page.goto(home + "#/companies/deepmind");
  await page.getByLabel("Role profile").selectOption("re");
  await expect(page.locator(".expectations-grid")).toBeVisible();
});
test("daily plan generates budgeted diverse questions and persists", async ({
  page,
}) => {
  await page.goto(home + "#/practice");
  await page.getByLabel("Time available").selectOption("30");
  await page.getByRole("button", { name: "Generate my practice" }).click();
  await expect(page.locator(".session-summary")).toContainText(
    "30 minutes of focus",
  );
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("research-practice:v1")),
  );
  expect(s.plan.items.reduce((a, x) => a + x.minutes, 0)).toBeLessThanOrEqual(
    30,
  );
  expect(new Set(s.plan.items.map((x) => x.id)).size).toBe(s.plan.items.length);
  await page.getByRole("button", { name: "Start first question" }).click();
  await expect(page.locator(".question-detail")).toBeVisible();
  await page.reload();
  await expect(page.locator(".session-summary")).toContainText(
    "30 minutes of focus",
  );
});
test("mock hides solutions, preserves answers across navigation and reveals recap after finish", async ({
  page,
}) => {
  await page.goto(home + "#/mock");
  await page
    .getByRole("button", { name: "Start mock interview", exact: true })
    .click();
  await expect(page.locator(".mock-clock")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show Solution" })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Interview answer / code")
    .fill("I assume i.i.d. samples.");
  await page.getByLabel("Answer confidence").selectOption("3");
  await page.getByRole("button", { name: "Next / skip" }).click();
  await page.locator(".mock-nav button").first().click();
  await expect(page.getByLabel("Interview answer / code")).toHaveValue(
    "I assume i.i.d. samples.",
  );
  await page.reload();
  await expect(page.getByLabel("Interview answer / code")).toHaveValue(
    "I assume i.i.d. samples.",
  );
  await page
    .getByRole("button", { name: "End interview", exact: true })
    .click();
  await page.getByRole("button", { name: "Finish and review" }).click();
  await expect(
    page.getByRole("heading", { name: "Interview recap" }),
  ).toBeVisible();
  await page.locator(".mock-result summary").first().click();
  await expect(page.locator(".mock-answer").first()).toContainText(
    "I assume i.i.d. samples.",
  );
  await page
    .locator(".mock-answer")
    .first()
    .getByRole("button", { name: "good", exact: true })
    .click();
  await expect(page.locator(".stats-grid")).toContainText("67%");
});
test("mobile fits without horizontal overflow and menu navigates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home);
  await expect(page.locator(".hero")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: "Questions Question explorer" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Question explorer", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(home + "#/questions/orthogonal-projection");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("bad backups are rejected without overwriting current state", async ({
  page,
}) => {
  await page.goto(home + "#/progress");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("alert")).toContainText("Unsupported backup");
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("research-practice:v1")),
  );
  expect(s.version).toBe(1);
});
test("expired mock resumes into recap, and valid backup restores durable data", async ({
  page,
}) => {
  await page.goto(home + "#/mock");
  await page
    .getByRole("button", { name: "Start mock interview", exact: true })
    .click();
  await expect(page.locator(".mock-clock")).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("research-practice:v1"));
    s.mock.start = Date.now() - 60000;
    s.mock.end = Date.now() - 1000;
    localStorage.setItem("research-practice:v1", JSON.stringify(s));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Interview recap" }),
  ).toBeVisible();
  const backup = await page.evaluate(() =>
    localStorage.getItem("research-practice:v1"),
  );
  await page.goto(home + "#/progress");
  await page.locator("input[type=file]").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(
    page.getByRole("button", { name: "Restore backup" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restore backup" }).click();
  await page.goto(home + "#/mock");
  await expect(
    page.getByRole("heading", { name: "Interview recap" }),
  ).toBeVisible();
});
test("keyboard global search and unknown deep links recover safely", async ({
  page,
}) => {
  await page.goto(home);
  await expect(page.locator("#global-search")).toBeVisible();
  await page.keyboard.press("Meta+k");
  await expect(page.locator("#global-search")).toBeFocused();
  await page.keyboard.type("PCA");
  await expect(page.locator(".search-results")).toBeVisible();
  await page.goto(home + "#/study/not-a-topic");
  await expect(
    page.getByRole("heading", { name: "Topic not found" }),
  ).toBeVisible();
});

test("unreadable saved data is preserved for recovery rather than overwritten", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "research-practice:v1",
      '{"version":999,"private_note":"preserve me"}',
    ),
  );
  await page.goto(home);
  await expect(page.getByRole("alert")).toContainText(
    "automatic saving is paused",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("research-practice:v1")),
  ).toContain("preserve me");
  await page
    .getByRole("button", { name: "Replace records and start fresh" })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("research-practice:v1")).version,
    ),
  ).toBe(1);
});

test("continuous lessons render explained math and scoped company evidence", async ({
  page,
}) => {
  await page.goto(home + "#/study/probability");
  await expect(
    page.locator('[data-section="Equations, explained"] .katex').first(),
  ).toBeAttached();
  await expect(
    page.locator('[data-section="Step-by-step derivation"]'),
  ).toBeAttached();
  await expect(page.locator(".symbol-glossary").first()).toBeAttached();
  await page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("button", { name: "Equations, explained", exact: true })
    .click();
  await expect(
    page.locator('[data-section="Equations, explained"]'),
  ).toBeFocused();
  expect(await page.locator(".katex-error").count()).toBe(0);
  await page.goto(home + "#/study");
  await expect(page.locator(".company-label.verified").first()).toBeVisible();
  await expect(page.locator(".company-label.inferred").first()).toBeVisible();
});
test("knowledge map follows concepts and opens connected lessons on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home + "#/map");
  await page.getByLabel("Find a concept").fill("softmax");
  await page.locator(".km-search-results button").first().click();
  await expect(page.locator(".km-trail")).toContainText("Softmax");
  await page.locator(".km-map-focus button.km-node").first().click();
  await expect(page.locator(".km-trail button")).toHaveCount(2);
  await page.getByRole("button", { name: "Open lesson", exact: true }).click();
  await expect(
    page.locator('[data-section="Concept connections"]'),
  ).toBeAttached();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("existing study records survive English presentation changes", async ({
  page,
}) => {
  await page.goto(home + "#/practice");
  await page.getByRole("button", { name: "Generate my practice" }).click();
  await expect(page.locator(".session-summary")).toBeVisible();
  const before = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("research-practice:v1"));
    s.plan.items[0].reason = "\ubcf5\uc2b5 \uc608\uc815\uc77c \ub3c4\ub798";
    s.drafts[s.plan.items[0].id] = "My original notes: \uc218\ud559";
    localStorage.setItem("research-practice:v1", JSON.stringify(s));
    return s;
  });
  await page.reload();
  await expect(page.locator(".plan-item").first()).toContainText(
    "Review is due",
  );
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("research-practice:v1")),
  );
  expect(after.drafts).toEqual(before.drafts);
  expect(after.reviews).toEqual(before.reviews);
  expect(after.plan).toEqual(before.plan);
});

test("GPU precision lessons connect formats, systems and active recall", async ({
  page,
}) => {
  await page.goto(home + "#/study/floating-point");
  await expect(page.locator(".precision-table")).toContainText("65,504");
  await page
    .getByRole("slider", { name: "Position between 1 and 2 (%)" })
    .fill("1");
  await expect(page.locator(".diagram svg")).toContainText("1.0100");
  await expect(page.locator(".diagram svg")).toContainText("1.0078125");
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(home + "#/map/floating-point");
  await expect(page.locator(".km-map-focus")).toBeVisible();
  await expect(page.locator(".km-root")).toContainText("Mixed");
});
