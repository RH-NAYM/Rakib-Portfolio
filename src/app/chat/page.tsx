import type { Metadata } from "next";
// /chat is the conversation itself, so it renders eagerly (thread restored on hydration).
import { ChatPage } from "@/components/chat/chat-shell";

export const metadata: Metadata = {
  title: "Chat with my AI twin",
  description: "Ask Rakib's AI twin about his work, in English, বাংলা or Banglish. Answers are grounded in his CV, projects and notes.",
  openGraph: {
    title: "Chat with my AI twin",
    description: "English · বাংলা · Banglish · voice · screenshots. Grounded in my CV, projects and notes.",
    images: [{ url: "/twin-og.png", width: 1200, height: 630, alt: "Rakib's AI twin answering in Banglish with cited sources" }],
  },
  twitter: { card: "summary_large_image", images: ["/twin-og.png"] },
};

export default function Page() {
  return (
    <div className="px-0 pt-16 sm:px-4">{/* clears the fixed 64px site header */}
      <ChatPage />
    </div>
  );
}
