import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Request } from "@playwright/test";

/** Phases 1b-4 in the browser. The agent is mocked; the twin's logic is covered by pytest + evals. */
const frame = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const final = (text: string, extra: Record<string, unknown> = {}) => ({
  v: 1, type: "final", msg_id: "m", text, lang: "en", card: null, media: [],
  sources: [{ n: 1, title: "Case study · Retail Vision", url: "https://example.com/work/retail" }],
  trace: { plan: ["find the retail project", "list results"], source_count: 1, revisions: 1, elapsed_ms: 5400, critic: { passed: true, removed_sentences: 0 } },
  ...extra,
});

async function mockChat(page: Page, bodies: string[]) {
  const requests: Request[] = [];
  let i = 0;
  await page.route("**/api/twin/chat", async (route) => {
    requests.push(route.request());
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body: bodies[Math.min(i++, bodies.length - 1)] });
  });
  return requests;
}

async function openChat(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Chat with my AI twin" }).click();
  return page.getByRole("dialog", { name: "Rakib (AI twin)" });
}

test("reply-to: keyboard R on a twin message quotes it and sends reply_to", async ({ page }) => {
  const reqs = await mockChat(page, [frame(final("I built a retail CV platform.[[1]]")), frame(final("The pipeline routes each image to a model.[[1]]"))]);
  const dlg = await openChat(page);
  await dlg.getByRole("button", { name: "Show me a computer-vision project" }).click();
  await expect(dlg.getByTestId("twin-bubble").getByText("I built a retail CV platform.")).toBeVisible();
  await dlg.locator("[data-msg]").filter({ hasText: "I built a retail CV platform." }).focus();
  await page.keyboard.press("r");
  await expect(dlg.getByTestId("quote-preview")).toContainText("I built a retail CV platform.");
  await dlg.getByRole("textbox").fill("explain this part more");
  await dlg.getByRole("textbox").press("Enter");
  await expect(dlg.getByTestId("twin-bubble").getByText("The pipeline routes each image to a model.")).toBeVisible();
  const body = reqs[1].postDataJSON();
  expect(body.reply_to).toEqual({ role: "assistant", text: "I built a retail CV platform." });
  await expect(dlg.getByTestId("visitor-bubble").last()).toContainText("I built a retail CV platform.");
});

test("language pill forces বাংলা for replies and the UI", async ({ page }) => {
  const reqs = await mockChat(page, [frame(final("আমি AI টিম লিড।[[1]]", { lang: "bn" }))]);
  const dlg = await openChat(page);
  await dlg.getByRole("button", { name: /Reply language/ }).click();
  await dlg.getByRole("menuitemradio", { name: "বাংলা" }).click();
  await expect(dlg.getByPlaceholder("রাকিবের টুইনকে লিখুন…")).toBeVisible();
  await dlg.getByRole("textbox").fill("what do you do?");
  await dlg.getByRole("textbox").press("Enter");
  await expect(dlg.getByTestId("twin-bubble").getByText("আমি AI টিম লিড।")).toBeVisible();
  expect(reqs[0].postDataJSON().lang).toBe("bn");
});

test("How I answered: plan, sources and fact check expand inline", async ({ page }) => {
  await mockChat(page, [frame(final("Retail CV at 2M+ outlets.[[1]]"))]);
  const dlg = await openChat(page);
  await dlg.getByRole("button", { name: "Show me a computer-vision project" }).click();
  await dlg.getByRole("button", { name: /How I answered/ }).click();
  const trace = dlg.getByTestId("trace");
  await expect(trace).toContainText("find the retail project");
  await expect(trace).toContainText("Case study · Retail Vision");
  await expect(trace).toContainText("All claims supported");
  const r = await new AxeBuilder({ page }).include("[data-chat-root]").analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
});

test("image attach: resized JPEG is sent, thumbnail shown, description stored", async ({ page }) => {
  const reqs = await mockChat(page, [frame({ v: 1, type: "meta", image_description: "A tiny test image" }) + frame(final("That's not one of my projects, but here's what I see.[[1]]"))]);
  const dlg = await openChat(page);
  await dlg.getByTestId("gallery-input").setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: PNG });
  await expect(dlg.getByTestId("twin-bubble").getByText("That's not one of my projects, but here's what I see.")).toBeVisible();
  const body = reqs[0].postDataJSON();
  expect(body.image.mime).toBe("image/jpeg");
  expect(Buffer.from(body.image.data, "base64").subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  await expect(dlg.getByTestId("visitor-bubble").locator("img")).toHaveAttribute("alt", "A tiny test image");
});

test("agent images open in a lightbox; Esc closes and focus returns", async ({ page }) => {
  const media = [
    { id: "a", src: "/profile-photos/photo-1.jpg", caption: "Retail dashboard", project_url: "https://example.com/work/retail" },
    { id: "b", src: "/profile-photos/photo-2.jpg", caption: "Detection view" },
  ];
  await mockChat(page, [frame(final("Here are two screenshots.[[1]]", { media }))]);
  const dlg = await openChat(page);
  await dlg.getByRole("button", { name: "Show me a computer-vision project" }).click();
  await dlg.getByRole("button", { name: "Retail dashboard" }).click();
  const box = page.getByRole("dialog", { name: "Retail dashboard" });
  await expect(box).toBeVisible();
  await expect(box.getByRole("link", { name: "Open project →" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Detection view" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Detection view" })).toHaveCount(0);
  await expect(dlg).toBeVisible(); // Esc closed only the lightbox, not the chat
});

test("lead form posts to /api/contact with a fixed subject and unverified chat context", async ({ page }) => {
  await mockChat(page, [frame(final("The real me handles that.", { card: "contact", sources: [] }))]);
  let contact: Record<string, string> = {};
  await page.route("**/api/contact", async (route) => {
    contact = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  const dlg = await openChat(page);
  await dlg.getByRole("button", { name: "How can I hire you?" }).click();
  await dlg.getByRole("button", { name: "Leave a message for the real me" }).click();
  await dlg.getByLabel("Your name").fill("Ayesha");
  await dlg.getByLabel("Your email").fill("ayesha@example.com");
  await dlg.getByLabel("Message", { exact: true }).fill("We'd like to talk about a CV contract.");
  await dlg.getByRole("button", { name: "Send to Rakib" }).click();
  await expect(dlg.getByText("Sent. The real me will reply by email.")).toBeVisible();
  expect(contact.subject).toBe("[AI Twin lead] How can I hire you?");
  expect(contact.message.startsWith("We'd like to talk about a CV contract.")).toBe(true);
  expect(contact.message).toContain("visitor-supplied, unverified");
});

test("voice: record with the mic, transcript shown, reply auto-plays", async ({ page }) => {
  const reqs = await mockChat(page, [frame({ v: 1, type: "meta", transcript: "tumi ki build korecho", lang: "banglish" }) + frame(final("Ami retail CV build korechi.[[1]]", { lang: "banglish" }))]);
  const tts: Request[] = [];
  await page.route("**/api/twin/tts", async (route) => {
    tts.push(route.request());
    const wav = Buffer.alloc(44 + 4800);
    wav.write("RIFF", 0); wav.writeUInt32LE(36 + 4800, 4); wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
    wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(4800, 40);
    await route.fulfill({ status: 200, contentType: "audio/wav", body: wav });
  });
  const dlg = await openChat(page);
  await dlg.getByRole("button", { name: "Record a voice message" }).click();
  await expect(dlg.getByTestId("recording")).toBeVisible();
  await page.waitForTimeout(1500);
  await dlg.getByRole("button", { name: "Send voice message" }).click();
  await expect(dlg.getByText(/Shunechi: “tumi ki build korecho”/)).toBeVisible();
  await expect(dlg.getByTestId("twin-bubble").getByText("Ami retail CV build korechi.")).toBeVisible();
  const body = reqs[0].postDataJSON();
  expect(body.audio.mime).toMatch(/^audio\/(webm|ogg|mp4)/);
  expect(body.message).toBe("");
  await expect.poll(() => tts.length).toBeGreaterThan(0);
  expect(tts[0].postDataJSON()).toEqual({ text: "Ami retail CV build korechi.", lang: "banglish" });
});

test("admin insights: sign in, then knowledge gaps and top questions", async ({ page }) => {
  let authed = false;
  await page.route("**/api/twin/admin/login", async (route) => {
    authed = route.request().postDataJSON().password === "pw";
    await route.fulfill({ status: authed ? 200 : 401, contentType: "application/json", body: JSON.stringify({ ok: authed }) });
  });
  await page.route("**/api/twin/admin/insights**", async (route) => {
    if (!authed) return route.fulfill({ status: 401, body: "{}" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, days: 7, conversations: 12, languages: { en: 7, banglish: 5 }, top_questions: [["what did you build?", 4]], unanswered: [{ q: "what is your gpa?" }], latency_ms: { p50: 6100, p95: 11000 }, spend: [{ day: "2026-11-18", usd: 0.12 }], logging: true }),
    });
  });
  await page.goto("/admin/insights");
  await page.getByLabel("Password").fill("nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong password.")).toBeVisible();
  await page.getByLabel("Password").fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Knowledge gaps" })).toBeVisible();
  await expect(page.getByText("what is your gpa?")).toBeVisible();
  await expect(page.getByText("what did you build?")).toBeVisible();
});

// ── regressions from the first production run (2026-11-18) ───────────────────
test("chat header stays on one line (global p text-wrap must not beat `truncate`)", async ({ page }) => {
  const dlg = await openChat(page);
  const name = dlg.getByText("Rakib (AI twin)", { exact: true }).first();
  const status = dlg.getByText("Answers from my CV, projects & notes").first();
  for (const el of [name, status]) {
    const lh = await el.evaluate((n) => parseFloat(getComputedStyle(n).lineHeight) || 20);
    expect((await el.boundingBox())!.height).toBeLessThan(lh * 1.5);
  }
});

test("every image on the home page and in the chat actually loads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Chat with my AI twin" }).click();
  await page.waitForLoadState("networkidle");
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => i.loading !== "lazy" || i.getBoundingClientRect().top < innerHeight)
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src),
  );
  expect(broken).toEqual([]);
  expect(await page.evaluate(() => Array.from(document.images).some((i) => i.src.includes("/_next/image")))).toBe(false);
});

test("/chat header sits below the fixed site header", async ({ page }) => {
  await page.goto("/chat");
  const siteHeader = await page.locator("header").first().boundingBox();
  const chatName = await page.locator("[data-chat-root]").getByText("Rakib (AI twin)", { exact: true }).first().boundingBox();
  expect(chatName!.y).toBeGreaterThanOrEqual(siteHeader!.y + siteHeader!.height - 1);
});

test("templated replies don't show an empty 'How I answered'", async ({ page }) => {
  await mockChat(page, [frame(final("Hi! I'm Rakib's AI twin.", { sources: [], trace: { plan: [], source_count: 0, revisions: 0, elapsed_ms: 600, critic: { passed: true, removed_sentences: 0 } } }))]);
  const dlg = await openChat(page);
  await dlg.getByRole("textbox").fill("hi");
  await dlg.getByRole("textbox").press("Enter");
  await expect(dlg.getByTestId("twin-bubble").getByText("Hi! I'm Rakib's AI twin.")).toBeVisible();
  await expect(dlg.getByRole("button", { name: /How I answered/ })).toHaveCount(0);
});
