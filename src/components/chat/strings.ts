/**
 * Every visible chat string in EN / বাংলা / Banglish (design 7C, state copy from 2A).
 * "Rakib", "AI twin" and technical terms stay in English in all three.
 */
export type UiLang = "en" | "bn" | "banglish";

const S = {
  name: { en: "Rakib (AI twin)", bn: "Rakib (AI twin)", banglish: "Rakib (AI twin)" },
  status: {
    en: "Answers from my CV, projects & notes",
    bn: "আমার CV, প্রজেক্ট আর নোট থেকে উত্তর দিই",
    banglish: "Amar CV, project ar notes theke answer dei",
  },
  disclosure: {
    en: "AI version of me · can make mistakes · Real me:",
    bn: "আমার AI সংস্করণ · ভুল হতে পারে · আসল আমি:",
    banglish: "Amar AI version · bhul hote pare · Real ami:",
  },
  contact: { en: "Contact", bn: "যোগাযোগ", banglish: "Contact" },
  greeting: {
    en: "Hi, I'm Rakib's AI twin. Ask me about my work, in English, বাংলা or Banglish.",
    bn: "হাই, আমি রাকিবের AI টুইন। আমার কাজ নিয়ে জিজ্ঞেস করুন: English, বাংলা বা Banglish-এ।",
    banglish: "Hi, ami Rakib er AI twin. Amar kaj niye jiggesh korun: English, বাংলা ba Banglish e.",
  },
  placeholder: { en: "Message Rakib's twin…", bn: "রাকিবের টুইনকে লিখুন…", banglish: "Rakib er twin ke likhun…" },
  send: { en: "Send", bn: "পাঠান", banglish: "Send" },
  open: { en: "Chat with my AI twin", bn: "আমার AI টুইনের সাথে কথা বলুন", banglish: "Amar AI twin er sathe kotha bolun" },
  close: { en: "Close chat", bn: "চ্যাট বন্ধ করুন", banglish: "Chat bondho korun" },
  expand: { en: "Open full screen", bn: "পূর্ণ স্ক্রিনে খুলুন", banglish: "Full screen e khulun" },
  newChat: { en: "New chat", bn: "নতুন চ্যাট", banglish: "Notun chat" },
  clearConfirm: { en: "Clear this conversation?", bn: "কথোপকথন মুছে ফেলবেন?", banglish: "Conversation ta muche felben?" },
  clear: { en: "Clear", bn: "মুছুন", banglish: "Clear" },
  cancel: { en: "Cancel", bn: "বাতিল", banglish: "Cancel" },
  retry: { en: "Retry", bn: "আবার চেষ্টা", banglish: "Retry" },
  step_planning: { en: "Planning", bn: "পরিকল্পনা করছি", banglish: "Plan korchi" },
  step_reading: { en: "Reading my notes", bn: "নোট পড়ছি", banglish: "Notes porchi" },
  step_checking: { en: "Checking facts", bn: "তথ্য যাচাই করছি", banglish: "Facts check korchi" },
  step_rechecking: { en: "Rechecking a claim", bn: "একটা তথ্য আবার যাচাই করছি", banglish: "Ekta claim abar check korchi" },
  howIAnswered: { en: "How I answered", bn: "কীভাবে উত্তর দিলাম", banglish: "Kivabe answer dilam" },
  sources: { en: "sources", bn: "সূত্র", banglish: "sources" },
  partial: { en: "My answer got cut off.", bn: "উত্তরটা মাঝপথে কেটে গেছে।", banglish: "Answer ta majhe kete geche." },
  outage: {
    en: "I'm having trouble thinking right now. You can reach the real me:",
    bn: "এই মুহূর্তে উত্তর দিতে সমস্যা হচ্ছে। আসল আমার সাথে যোগাযোগ করুন:",
    banglish: "Ekhon answer dite problem hocche. Real ami ke contact korun:",
  },
  resting: {
    en: "I'm resting for today. The real me is one message away:",
    bn: "আজকের মতো বিশ্রামে আছি। আসল আমি এক মেসেজ দূরে:",
    banglish: "Ajker moto rest e achi. Real ami ek message dure:",
  },
  rateLimited: {
    en: "You've asked a lot. Try again in {m} min.",
    bn: "অনেক প্রশ্ন হয়েছে। {m} মিনিট পর আবার চেষ্টা করুন।",
    banglish: "Onek question hoyeche. {m} min pore abar try korun.",
  },
  badRequest: {
    en: "I couldn't read that message. Try shortening it.",
    bn: "মেসেজটা পড়তে পারিনি। একটু ছোট করে লিখুন।",
    banglish: "Message ta porte parini. Ektu choto kore likhun.",
  },
  offline: { en: "You're offline. I'll be here when you're back.", bn: "আপনি অফলাইনে আছেন।", banglish: "Apni offline e achen." },
  realMeTitle: { en: "Talk to the real me", bn: "আসল আমার সাথে কথা বলুন", banglish: "Real amar sathe kotha bolun" },
  contactForm: { en: "Contact form", bn: "যোগাযোগ ফর্ম", banglish: "Contact form" },
  copy: { en: "Copy", bn: "কপি", banglish: "Copy" },
  copied: { en: "Copied", bn: "কপি হয়েছে", banglish: "Copied" },
  aiTag: { en: "AI", bn: "AI", banglish: "AI" },
} as const satisfies Record<string, Record<UiLang, string>>;

export type StringKey = keyof typeof S;

export function t(key: StringKey, lang: UiLang, vars?: Record<string, string | number>): string {
  let s: string = S[key][lang] ?? S[key].en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const PROMPTS: Record<UiLang, string[]> = {
  en: ["What did you build at your last job?", "Show me a computer-vision project", "Banglay bolo", "How can I hire you?"],
  bn: ["আপনার শেষ চাকরিতে কী বানিয়েছেন?", "একটা computer-vision প্রজেক্ট দেখান", "In English please", "আপনাকে কীভাবে hire করব?"],
  banglish: ["Last job e ki build korecho?", "Ekta computer-vision project dekhao", "In English please", "Tomake kivabe hire korbo?"],
};

export const STRING_KEYS = Object.keys(S) as StringKey[];
export const ALL = S;
