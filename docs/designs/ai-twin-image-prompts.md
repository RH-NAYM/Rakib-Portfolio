# AI Twin: image prompts

Paste these into your image generator. Every prompt uses the site's real tokens from `src/app/globals.css`, so the results match the portfolio. Shared rules for all of them:

- **Palette:** background `#06070a`, elevated surface `#0b0d12`, surfaces `#0f1218` / `#141821`, borders `#1c2230` / `#2a3344`, text `#e8ecf3`, muted text `#9aa4b6`, faint text `#5f6b80`, accent electric cyan `#38bdf8`, accent soft `rgba(56,189,248,0.12)`, success `#34d399`.
- **Type:** Archivo (a variable-width grotesk) for Latin text and Anek Bangla for Bengali script. JetBrains Mono appears only in the trace panel.
- **Style:** dark only, flat surfaces with 1px borders. No drop shadows, glow, glassmorphism, blur, gradients behind text, emoji, or purple gradients. Radius is 8px on controls and about 18px on message bubbles.
- **Avoid in every image:** generic SaaS card grids, stock-photo people, a robot or bot mascot, neon halos, lorem ipsum, and misspelled Bangla. If your generator mangles Bengali script, generate with English text and overlay the Bangla lines yourself.

Images 1-3 are design mockups (reference only, not shipped). Images 4-6 ship on the site.

---

## 1. Mobile chat screen mockup (reference for phase 1a/1b)

**Size:** 1170×2532 px (iPhone 15 at 3x), portrait. Show only the phone screen, no device frame.

**Prompt:**
> A high-fidelity mobile app UI screenshot of a dark-theme messaging chat with "Rakib's AI twin", on a developer portfolio. Flat dark UI, background #06070a. Status bar at top (9:41, signal, battery) in #e8ecf3.
>
> **Header** (height 64px, background #0b0d12, bottom border 1px #1c2230): left a back chevron; a 36px circular profile photo of a young South Asian man in his late 20s with short black hair and a light beard, smiling, wearing a dark crew-neck tee; a small rounded rectangle tag reading "AI" in #38bdf8 on a translucent cyan fill at the photo's bottom-right corner. Next to it, two lines: "Rakib (AI twin)" in 17px semibold Archivo #e8ecf3, and below it "Answers from my CV, projects & notes" in 13px #9aa4b6. On the right a small pill "Auto · EN" with 1px border #2a3344, text #9aa4b6, then a "⋯" icon.
>
> **Disclosure line** directly under the header: one line of 12px text in #5f6b80, "AI version of me · can make mistakes · Real me: Contact", with "Contact" underlined in #38bdf8, and a tiny ✕ at the right.
>
> **Thread** (left/right padding 16px, 8px between bubbles of the same sender, 16px between senders):
> 1. Right-aligned visitor bubble, background #38bdf8, text #06070a, 16px: "tumi last company te ki korecho?" with a tiny double-check tick under it in #5f6b80.
> 2. Left-aligned twin message: a 28px version of the same profile photo with the tiny "AI" tag, beside a bubble with background #0f1218, 1px border #1c2230, text #e8ecf3, 16px line-height 1.6: "Ami Acme Vision e AI Team Lead chilam. 6 joner team niye production computer-vision pipeline build korechi, latency 40% komiyechi.¹ ²". The superscripts ¹ and ² are small and #38bdf8. Inside the bubble's bottom edge, separated by a hairline #1c2230, a 12px line in #9aa4b6: "How I answered · 4 sources · 6.2s ›". Beside the bubble, a small circular ▶ play button with a 1px #2a3344 border.
> 3. Left-aligned twin image message: two screenshot tiles side by side in a 2-column group with 4px gap and 12px rounded corners. Left tile: a dark analytics dashboard with cyan line charts. Right tile: a video frame with green #34d399 bounding boxes around people in a retail store. A caption below in 13px #9aa4b6: "Retail Vision dashboard".
> 4. Right-aligned visitor reply bubble (#38bdf8): at its top, a quoted strip with a slightly darker cyan fill, a 3px left bar in #06070a at 40% opacity, small text "Rakib (AI twin)" and "…production computer-vision pipeline build korechi…", then the message "explain this part more".
> 5. Left-aligned twin bubble in its waiting state: a row of small pill chips inside the bubble. "✓ Planning" and "✓ Reading my notes" in #5f6b80 with 1px #1c2230 borders, then "Checking facts…" in #e8ecf3 with a tiny cyan spinner.
>
> **Composer** pinned at the bottom (background #0b0d12, top border 1px #1c2230, 12px padding plus home-indicator safe area): a 44px circular "+" button with 1px border #2a3344; a rounded text field (#06070a fill, 1px border #1c2230) with placeholder "Message Rakib's twin…" in #5f6b80; a 44px solid #38bdf8 circle with a black microphone icon on the right. Home indicator bar below.
>
> Crisp, realistic UI rendering, pixel-perfect alignment, calm and dense but readable. Not a marketing render: no hands, no device frame, no background scene.

---

## 2. Desktop `/chat` page with trace drawer (reference for phase 1b)

**Size:** 2880×1800 px (1440×900 at 2x), landscape.

**Prompt:**
> A high-fidelity desktop web app screenshot, dark theme, background #06070a. Thin top site navigation bar (height 56px, border-bottom 1px #1c2230) with the text logo "Rakibul Hasan Naym" in Archivo semibold #e8ecf3 on the left and nav links "Work · Projects · Blog · Contact" in #9aa4b6 on the right.
>
> **Center column** 680px wide: the same chat as a phone messenger. Header row with a 40px profile photo of a young South Asian man with a small cyan "AI" tag, "Rakib (AI twin)" and "Answers from my CV, projects & notes", and a pill "Auto · বাংলা" on the right. The thread has a right-aligned cyan (#38bdf8) visitor bubble with black text in Bangla script, "আপনি কোন প্রজেক্টে LangGraph ব্যবহার করেছেন?", and a left-aligned twin bubble (#0f1218, border #1c2230) with a two-paragraph first-person answer in Bangla script with small cyan superscript ¹ ² ³ markers, followed by the line "How I answered · 5 sources · 5.8s ›" highlighted as the active item. Composer at the bottom of the column: a "+" button, a wide text field, and a cyan send button with an arrow.
>
> **Right drawer** 360px wide, background #0b0d12, left border 1px #1c2230, titled "How I answered" in 15px semibold. Three sections with small uppercase 11px #5f6b80 labels:
> - PLAN: three numbered sub-queries in JetBrains Mono 13px #9aa4b6.
> - SOURCES: five rows, each with a cyan number, a title ("CV · Acme Vision", "Case study · Retail Vision", "Blog · LangGraph in production", "README · twin-agent", "Notes · Q&A") and a faint path.
> - FACT CHECK: a green #34d399 check, "All claims supported", and "Score 0.94 · 0 revisions".
>
> Lots of calm negative space either side of the column. Flat, no shadows, no gradients.

---

## 3. Desktop panel + launcher on the portfolio home (reference for phase 1a)

**Size:** 2880×1800 px, landscape.

**Prompt:**
> A high-fidelity screenshot of a dark developer-portfolio homepage (background #06070a, large Archivo headline "Applied AI Engineer" in #e8ecf3 on the left, a muted subtitle and two outline buttons below), with a chat panel open at the bottom-right corner.
>
> The panel is 400×640 px, 24px from the right and bottom edges, background #0b0d12, 1px border #2a3344, 12px radius, no shadow. Panel header: a 36px profile photo of a young South Asian man with a tiny cyan "AI" tag, "Rakib (AI twin)" and the status line, plus "⤢" expand and "✕" close icons on the right. Below it: the faint one-line disclosure, then a first-person greeting bubble from the twin, "Hi, I'm Rakib's AI twin. Ask me about my work, in English, বাংলা or Banglish.", then four stacked outline pill chips in #9aa4b6 with 1px #2a3344 borders: "What did you build at your last job?", "Show me a computer-vision project", "Banglay bolo", "How can I hire you?". At the bottom, a composer with a text field and a cyan send button.
>
> Under the panel, the 56px circular launcher shows the same face photo with a 2px #38bdf8 ring and a small "AI" tag. Flat, calm, no glow.

---

## 4. Launcher and avatar photo (ships: replaces the Bot icon)

This is an **edit of your real photo, not a generated face.** Generating a fake face of you would contradict the "honest AI twin" design.

**Source:** pick one photo from `public/profile-photos/` where you face the camera.

**Edit instructions (for any photo editor or an AI edit tool):**
> Crop a tight square headshot: the face fills about 70% of the frame, the eyes sit on the upper third line, and the top of the head is slightly cropped. Remove the background and replace it with a flat #0f1218. Slightly lift shadows on the face so it stays readable at 28px. Do not change facial features, skin tone or expression. Export 512×512 PNG and 512×512 WebP (quality 85). Name them `twin-avatar.png` and `twin-avatar.webp`.

The cyan ring and the "AI" tag are drawn in CSS, not baked into the image.

---

## 5. "AI" tag mark (optional, ships as SVG)

You can skip generating this, because the plan draws it in CSS: an 8px-radius pill with an `rgba(56,189,248,0.12)` fill, text "AI" in Archivo 10px bold #38bdf8, 2px horizontal padding. If you want a drawn mark instead:

**Size:** 256×256 px, transparent background.

**Prompt:**
> A minimal flat vector badge reading "AI" in a bold, slightly wide grotesk sans-serif (similar to Archivo Expanded Bold), letters #38bdf8, inside a rounded-rectangle pill with a translucent cyan fill (#38bdf8 at 12% opacity) and no stroke. Perfectly centered, generous inner padding, transparent background. No gradient, glow, sparkles, robot or brain icon, or 3D. Must stay legible when scaled down to 14px tall.

---

## 6. LinkedIn / Open Graph launch image for the twin (ships)

**Size:** 1200×627 px (LinkedIn), also usable as OG at 1200×630.

**Prompt:**
> A clean, dark social share card, background #06070a with a very subtle 1px grid of #0f1218 lines (barely visible, no glow). Left half: large headline in Archivo bold, #e8ecf3, two lines, "Chat with my AI twin", then a second line in Anek Bangla, "আমার AI টুইনের সাথে কথা বলুন", in #9aa4b6. Below, a small cyan #38bdf8 line: "English · বাংলা · Banglish · voice · screenshots". Bottom-left: "rakib.dev/chat" in 20px #5f6b80 (replace with your real domain).
>
> Right half: a cropped, tilted (−4°) phone-screen fragment of the dark chat UI described in mockup 1. Show the photo avatar with the "AI" tag, one cyan visitor bubble "tumi ki build korecho?", and one dark twin bubble with a first-person answer and small cyan superscript citations, plus a row of step chips "✓ Planning · ✓ Reading my notes · Checking facts…". The phone fragment has a 1px #2a3344 border and no shadow.
>
> Flat, sharp and professional. No people photos other than the tiny avatar, no robots, no gradients, no emoji.

**Tip:** generate mockup 1 first, then build image 6 from a real screenshot of the shipped chat. A real screenshot beats a generated one for a launch post.
