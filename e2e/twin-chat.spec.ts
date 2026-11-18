import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** The agent is mocked at the network layer: these tests cover the shell, not the model (that's the eval suite). */
const frame = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const steps = [
  { v: 1, type: "step", step: "planning", status: "active" },
  { v: 1, type: "step", step: "planning", status: "done" },
  { v: 1, type: "step", step: "reading", status: "active" },
  { v: 1, type: "step", step: "reading", status: "done" },
  { v: 1, type: "step", step: "checking", status: "active" },
  { v: 1, type: "step", step: "checking", status: "done" },
];
const answer = (text: string, lang = "banglish", card: string | null = null) => ({
  v: 1, type: "final", msg_id: "m1", text, lang, card, media: [],
  sources: [{ n: 1, title: "Experience · HawkEyes", url: "https://example.com/#experience" }],
  trace: { plan: ["role"], source_count: 1, revisions: 0, elapsed_ms: 6200, critic: { passed: true, removed_sentences: 0 } },
});

async function mockAgent(page: Page, bodies: string[]) {
  let i = 0;
  await page.route("**/api/twin/chat", async (route) => {
    const body = bodies[Math.min(i++, bodies.length - 1)];
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });
}

async function openChat(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Chat with my AI twin" }).click();
  await expect(page.getByRole("dialog", { name: "Rakib (AI twin)" })).toBeVisible();
}

test("opened state: photo header, disclosure, greeting and prompt chips (design 1A)", async ({ page }) => {
  await openChat(page);
  const dlg = page.getByRole("dialog", { name: "Rakib (AI twin)" });
  await expect(dlg.getByText("Answers from my CV, projects & notes")).toBeVisible();
  await expect(dlg.getByText(/AI version of me/)).toBeVisible();
  await expect(dlg.getByText(/I'm Rakib's AI twin/)).toBeVisible();
  await expect(dlg.getByRole("button", { name: "Banglay bolo" })).toBeVisible();
  const results = await new AxeBuilder({ page }).include("[data-chat-root]").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test("Banglish question: chips, cited first-person answer, no 'seen' receipt", async ({ page }) => {
  await mockAgent(page, [
    steps.map(frame).join("") +
      frame({ v: 1, type: "meta", lang: "banglish" }) +
      frame({ v: 1, type: "token", text: "Ami HawkEyes e AI Team Lead.[[1]]" }) +
      frame(answer("Ami HawkEyes e AI Team Lead.[[1]]")),
  ]);
  await openChat(page);
  const dlg = page.getByRole("dialog");
  await dlg.getByRole("textbox").fill("tumi last company te ki korecho?");
  await dlg.getByRole("button", { name: "Send" }).click();
  const bubble = dlg.getByTestId("twin-bubble").last();
  await expect(bubble).toContainText("Ami HawkEyes e AI Team Lead.");
  await expect(bubble.getByRole("button", { name: "Experience · HawkEyes" })).toHaveText("1");
  await expect(bubble).toContainText("6.2s");
  await expect(dlg.getByText(/seen/i)).toHaveCount(0);
  // UI follows the reply language (design 7C)
  await expect(dlg.getByPlaceholder("Rakib er twin ke likhun…")).toBeVisible();
  // thread survives a reload (shared localStorage thread, design 6A)
  await page.reload();
  await page.getByRole("button", { name: "Chat with my AI twin" }).click();
  await expect(page.getByRole("dialog").getByTestId("twin-bubble").getByText("Ami HawkEyes e AI Team Lead.")).toBeVisible();
});

test("outage: error bubble with contact card, Retry recovers (eng D3)", async ({ page }) => {
  await mockAgent(page, [frame({ v: 1, type: "error", kind: "upstream_unavailable" }), steps.map(frame).join("") + frame(answer("Back now.[[1]]", "en"))]);
  await openChat(page);
  const dlg = page.getByRole("dialog");
  await dlg.getByRole("button", { name: "How can I hire you?" }).click();
  await expect(dlg.getByText(/having trouble thinking/)).toBeVisible();
  await expect(dlg.getByTestId("handoff-card")).toContainText("Talk to the real me");
  const axeErr = await new AxeBuilder({ page }).include("[data-chat-root]").analyze();
  expect(axeErr.violations.map((v) => v.id)).toEqual([]);
  await dlg.getByRole("button", { name: "Retry" }).click();
  await expect(dlg.getByTestId("twin-bubble").getByText("Back now.")).toBeVisible();
});

test("budget cap: resting message, card, composer disabled", async ({ page }) => {
  await mockAgent(page, [frame({ v: 1, type: "error", kind: "cap_exceeded" })]);
  await openChat(page);
  const dlg = page.getByRole("dialog");
  await dlg.getByRole("button", { name: "Banglay bolo" }).click();
  await expect(dlg.getByText(/resting for today/)).toBeVisible();
  await expect(dlg.getByRole("textbox")).toBeDisabled();
});

test("Bangla answers render in Anek Bangla with roomy line-height (design 5A)", async ({ page }) => {
  await mockAgent(page, [frame(answer("আমি HawkEyes-এ AI টিম লিড।[[1]]", "bn"))]);
  await openChat(page);
  const dlg = page.getByRole("dialog");
  await dlg.getByRole("textbox").fill("আপনি কী করেন?");
  await dlg.getByRole("textbox").press("Enter");
  // UI switches to বাংলা as soon as a Bengali message is sent (design 7C)
  await expect(dlg.getByRole("button", { name: "পাঠান" })).toBeVisible();
  const p = dlg.locator('p[lang="bn"]').filter({ hasText: "আমি HawkEyes" });
  await expect(p).toBeVisible();
  const style = await p.evaluate((el) => ({ font: getComputedStyle(el).fontFamily, lh: getComputedStyle(el).lineHeight, fs: getComputedStyle(el).fontSize }));
  expect(style.font).toMatch(/Anek/i);
  expect(parseFloat(style.lh) / parseFloat(style.fs)).toBeCloseTo(1.75, 1);
});

test("/chat page shares the thread and has no floating launcher", async ({ page }) => {
  await mockAgent(page, [frame(answer("Shared thread.[[1]]", "en"))]);
  await openChat(page);
  await page.getByRole("dialog").getByRole("button", { name: "Show me a computer-vision project" }).click();
  await expect(page.getByTestId("twin-bubble").getByText("Shared thread.")).toBeVisible();
  await page.goto("/chat");
  await expect(page.getByTestId("twin-bubble").getByText("Shared thread.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Chat with my AI twin" })).toHaveCount(0);
});
