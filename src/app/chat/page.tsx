import type { Metadata } from "next";
// /chat is the conversation itself, so it renders eagerly (thread restored on hydration).
import { ChatPage } from "@/components/chat/chat-shell";

export const metadata: Metadata = {
  title: "Chat with my AI twin",
  description: "Ask Rakib's AI twin about his work, in English, বাংলা or Banglish. Answers are grounded in his CV, projects and notes.",
};

export default function Page() {
  return (
    <div className="px-0 sm:px-4">
      <ChatPage />
    </div>
  );
}
