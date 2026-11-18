"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Client-only, lazy: the chat is not part of first paint.
const ChatLauncher = dynamic(() => import("./chat-shell").then((m) => m.ChatLauncher), { ssr: false });

/** Floating launcher on every page except /chat, which renders the full conversation itself. */
export function ChatWidget() {
  const path = usePathname();
  return path === "/chat" ? null : <ChatLauncher />;
}

