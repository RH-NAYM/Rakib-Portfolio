"use client";

import dynamic from "next/dynamic";

// Chat widget is not part of the critical first paint — it's a floating
// button nobody touches until they've already read the page. Loading it
// dynamically (client-only, no SSR) keeps its JS (icons + fetch logic) out
// of the initial hydration cost, which matters most on slow mobile CPUs.
// `ssr: false` requires a client-component boundary, hence this wrapper
// instead of calling dynamic() directly from the (server) root layout.
const ChatWidget = dynamic(() => import("@/components/chat-widget").then((m) => m.ChatWidget), {
  ssr: false,
});

export { ChatWidget };
