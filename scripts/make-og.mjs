// Renders the AI-twin launch card (public/twin-og.png, 1200x630) from the REAL chat UI:
// 1) open the built site, mock one twin reply, screenshot the chat panel; 2) compose the card.
// Usage: npx next build && npx next start -p 3200 &  node scripts/make-og.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.OG_BASE ?? "http://localhost:3200";
const frame = (o) => `data: ${JSON.stringify(o)}\n\n`;
const steps = ["planning", "reading", "checking"].flatMap((s) => [
  { v: 1, type: "step", step: s, status: "active" },
  { v: 1, type: "step", step: s, status: "done" },
]);
const answer = "Ami HawkEyes e AI Team Lead. Amar banano retail computer-vision system 2M+ outlet e ~99% accuracy te cholche.[[1]][[2]]";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 760 }, deviceScaleFactor: 2 });
await page.route("**/api/twin/chat", (r) =>
  r.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
    body:
      steps.map(frame).join("") +
      frame({ v: 1, type: "meta", lang: "banglish" }) +
      frame({
        v: 1, type: "final", msg_id: "og", text: answer, lang: "banglish", card: null, media: [],
        sources: [{ n: 1, title: "Experience · HawkEyes", url: "" }, { n: 2, title: "Case study · Retail Vision", url: "" }],
        trace: { plan: ["role", "results"], source_count: 2, revisions: 0, elapsed_ms: 6200, critic: { passed: true, removed_sentences: 0 } },
      }),
  }),
);
await page.goto(`${BASE}/chat`);
await page.getByRole("button", { name: /Dismiss/ }).first().click();
await page.getByRole("textbox").fill("tumi last company te ki korecho?");
await page.getByRole("textbox").press("Enter");
await page.getByText("Ami HawkEyes e AI Team Lead.").first().waitFor();
await page.waitForTimeout(600);
const shot = await page.locator("[data-chat-root]").screenshot();

const avatar = readFileSync("public/twin-avatar.webp").toString("base64");
const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await card.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..800&family=Anek+Bangla:wght@500;600&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:1200px;height:630px;background:#06070a;font-family:Archivo,sans-serif;color:#e8ecf3;overflow:hidden;position:relative}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#0f1218 1px,transparent 1px),linear-gradient(90deg,#0f1218 1px,transparent 1px);background-size:48px 48px;opacity:.55}
  .left{position:absolute;left:72px;top:92px;width:560px}
  .who{display:flex;align-items:center;gap:16px;margin-bottom:40px}
  .who img{width:64px;height:64px;border-radius:50%;border:2px solid #38bdf8}
  .who b{font-size:22px} .tag{font-size:13px;font-weight:700;color:#38bdf8;background:rgba(56,189,248,.12);border-radius:6px;padding:2px 7px;margin-left:8px}
  .who span.s{display:block;color:#9aa4b6;font-size:16px;margin-top:2px}
  h1{font-size:68px;line-height:1.02;margin:0;font-stretch:110%;font-weight:800;letter-spacing:-.5px}
  .bn{font-family:'Anek Bangla',sans-serif;font-size:30px;color:#9aa4b6;margin:18px 0 0;font-weight:500}
  .feat{margin-top:34px;color:#38bdf8;font-size:19px;font-weight:600}
  .url{position:absolute;left:72px;bottom:56px;color:#9aa4b6;font-size:20px}
  .phone{position:absolute;right:64px;top:42px;width:390px;transform:rotate(-3deg);border:1px solid #2a3344;border-radius:22px;overflow:hidden}
  .phone img{display:block;width:100%}
</style></head><body><div class="grid"></div>
<div class="left">
  <div class="who"><img src="data:image/webp;base64,${avatar}"><div><b>MD Rakibul Hasan Naym<span class="tag">AI twin</span></b><span class="s">Applied AI Engineer · AI Team Lead</span></div></div>
  <h1>Chat with my<br>AI twin</h1>
  <p class="bn">আমার AI টুইনের সাথে কথা বলুন</p>
  <div class="feat">English · বাংলা · Banglish · voice · screenshots</div>
</div>
<div class="url">rakib-portfolio-lilac.vercel.app/chat</div>
<div class="phone"><img src="data:image/png;base64,${shot.toString("base64")}"></div>
</body></html>`);
await card.waitForLoadState("networkidle");
await card.evaluate(() => document.fonts.ready);
writeFileSync("public/twin-og.png", await card.screenshot({ type: "png" }));
await browser.close();
console.log("wrote public/twin-og.png");
