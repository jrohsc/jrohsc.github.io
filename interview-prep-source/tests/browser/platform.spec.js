import { test, expect } from "@playwright/test";
const home = "/interview-prep/";
test("all primary pages render and curriculum filters and interactive diagrams work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(home);
  await expect(
    page.getByRole("heading", { name: "오늘의 작은 연습, 내일의 깊은 답변." }),
  ).toBeVisible();
  for (const [route, title] of [
    ["study", "연결해서 배우는 AI · ML"],
    ["questions", "질문 탐색"],
    ["companies", "회사보다 구체적으로, 직무까지."],
    ["practice", "오늘은 무엇을 연습할까요?"],
    ["mock", "모의면접"],
    ["review", "다시 꺼내볼 시간"],
    ["progress", "얼마나 깊이 이해하고 있나요?"],
    ["guide", "다시 읽기보다, 다시 꺼내기."],
  ]) {
    await page.goto(home + "#/" + route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.goto(home + "#/study?category=math");
  await expect(page.locator(".topic-card")).toHaveCount(10);
  await page.goto(home + "#/study/spectral");
  await page.getByRole("tab", { name: "시각화" }).click();
  await expect(page.locator(".diagram svg")).toBeVisible();
  await page.locator("input[type=range]").fill("70");
  await expect(page.locator(".range-label strong")).toHaveText("70");
  await page.goto(home + "#/questions");
  await page.getByRole("textbox", { name: "질문 검색" }).fill("softmax");
  await expect(page.locator(".question-row").first()).toBeVisible();
  expect(errors).toEqual([]);
});
test("recall hides answers, saves drafts, grades, records mistakes and preserves reload", async ({
  page,
}) => {
  await page.goto(home + "#/questions/orthogonal-projection");
  await expect(page.locator(".solution")).toHaveCount(0);
  await page.getByLabel("나의 답변 / 풀이").fill("잔차는 열공간에 직교한다.");
  await page.getByRole("button", { name: "Hint 1", exact: true }).click();
  await expect(page.locator(".hint-box")).toContainText("잔차");
  await page.getByRole("button", { name: "Show Solution" }).click();
  await expect(page.locator(".solution-lead")).toBeVisible();
  await page.getByRole("button", { name: /Again 다시 학습/ }).click();
  await page.getByLabel("내가 생각했던 것").fill("역행렬은 항상 존재한다");
  await page.getByLabel("왜 틀렸는지").fill("열이 종속일 수 있다");
  await page.getByLabel("올바른 원리").fill("rank를 확인한다");
  await page
    .getByLabel("다음에는 어떻게 알아볼지")
    .fill("shape와 SVD를 확인한다");
  await page.getByRole("button", { name: "오답 저장" }).click();
  await page.reload();
  await expect(page.getByLabel("나의 답변 / 풀이")).toHaveValue(
    "잔차는 열공간에 직교한다.",
  );
  await expect(page.locator(".solution")).toHaveCount(0);
  await page.goto(home + "#/review");
  await page.getByRole("button", { name: "오답 노트 1" }).click();
  await expect(page.locator(".mistake-entry")).toContainText("rank를 확인한다");
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
  await page.getByLabel("비교할 직무").selectOption("mle");
  const after = await page.locator("tbody").textContent();
  expect(after).not.toBe(before);
  await page.locator("td summary").first().click();
  await expect(page.locator(".cell-detail").first()).toBeVisible();
  await page.goto(home + "#/companies/deepmind");
  await page
    .getByRole("button", { name: "Research Engineer", exact: true })
    .click();
  await expect(page.locator(".expectations-grid")).toBeVisible();
});
test("daily plan generates budgeted diverse questions and persists", async ({
  page,
}) => {
  await page.goto(home + "#/practice");
  await page.getByLabel("학습 시간").selectOption("30");
  await page.getByRole("button", { name: "맞춤 연습 만들기" }).click();
  await expect(page.locator(".session-summary")).toContainText("30분의 집중");
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("research-practice:v1")),
  );
  expect(s.plan.items.reduce((a, x) => a + x.minutes, 0)).toBeLessThanOrEqual(
    30,
  );
  expect(new Set(s.plan.items.map((x) => x.id)).size).toBe(s.plan.items.length);
  await page.getByRole("button", { name: "첫 질문 시작" }).click();
  await expect(page.locator(".question-detail")).toBeVisible();
  await page.reload();
  await expect(page.locator(".session-summary")).toContainText("30분의 집중");
});
test("mock hides solutions, preserves answers across navigation and reveals recap after finish", async ({
  page,
}) => {
  await page.goto(home + "#/mock");
  await page
    .getByRole("button", { name: "모의면접 시작", exact: true })
    .click();
  await expect(page.locator(".mock-clock")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show Solution" })).toHaveCount(
    0,
  );
  await page
    .getByLabel("면접 답변 · 코드")
    .fill("내 가정은 i.i.d. 표본입니다.");
  await page.getByLabel("답변 확신도").selectOption("3");
  await page.getByRole("button", { name: "다음 / 건너뛰기" }).click();
  await page.locator(".mock-nav button").first().click();
  await expect(page.getByLabel("면접 답변 · 코드")).toHaveValue(
    "내 가정은 i.i.d. 표본입니다.",
  );
  await page.reload();
  await expect(page.getByLabel("면접 답변 · 코드")).toHaveValue(
    "내 가정은 i.i.d. 표본입니다.",
  );
  await page.getByRole("button", { name: "면접 종료", exact: true }).click();
  await page.getByRole("button", { name: "종료 · 회고" }).click();
  await expect(
    page.getByRole("heading", { name: "모의면접 회고" }),
  ).toBeVisible();
  await page.locator(".mock-result summary").first().click();
  await expect(page.locator(".mock-answer").first()).toContainText(
    "내 가정은 i.i.d. 표본입니다.",
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
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: "Questions 질문 탐색" })
    .click();
  await expect(
    page.getByRole("heading", { name: "질문 탐색", exact: true }),
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
  await expect(page.getByRole("alert")).toContainText("지원하지 않는 백업");
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
    .getByRole("button", { name: "모의면접 시작", exact: true })
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
    page.getByRole("heading", { name: "모의면접 회고" }),
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
  await expect(page.getByRole("button", { name: "복원 적용" })).toBeVisible();
  await page.getByRole("button", { name: "복원 적용" }).click();
  await page.goto(home + "#/mock");
  await expect(
    page.getByRole("heading", { name: "모의면접 회고" }),
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
    page.getByRole("heading", { name: "주제를 찾을 수 없습니다" }),
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
  await expect(page.getByRole("alert")).toContainText("덮어쓰기를 중지");
  expect(
    await page.evaluate(() => localStorage.getItem("research-practice:v1")),
  ).toContain("preserve me");
  await page.getByRole("button", { name: "기존 기록 대신 새로 시작" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("research-practice:v1")).version,
    ),
  ).toBe(1);
});
