/**
 * Rakibul AI Chat Widget
 * Self-contained vanilla JS — no dependencies.
 * Handles: session creation, message sending, streaming UI,
 *          markdown rendering, suggested questions.
 */

(function () {
  "use strict";

  // ── Configuration ───────────────────────────────────────────
  const CONFIG = {
    API_SESSION: "/api/chat/session",
    API_CHAT: "/api/chat",
    TYPING_DELAY_MS: 400,       // Fake "thinking" delay for UX
    MAX_INPUT_CHARS: 2000,
    WELCOME_DELAY_MS: 800,
  };

  const SUGGESTED_QUESTIONS = [
    "What projects has Rakibul shipped to production?",
    "Tell me about the Retail AI platform",
    "What's his approach to Computer Vision?",
    "How does he handle MLOps in production?",
    "I'm looking to hire an AI consultant",
  ];

  const WELCOME_MESSAGE = `Hey — I'm **Rakibul AI**, representing MD Rakibul Hasan Naym.

I can tell you about his work in production AI, Computer Vision, Retail AI systems, LLM deployments, and more. Or if you're evaluating him for a project, let's talk about that too.

What would you like to know?`;

  // ── State ────────────────────────────────────────────────────
  let sessionId = null;
  let isOpen = false;
  let isLoading = false;
  let hasInteracted = false;

  // ── DOM References ───────────────────────────────────────────
  let panel, launchBtn, messagesEl, textarea, sendBtn, typingIndicator;

  // ── SVG Icons ────────────────────────────────────────────────
  const ICONS = {
    bot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <path d="M12 11V7"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M8 15h.01M16 15h.01"/>
    </svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M22 2L11 13"/>
      <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
    </svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,
    ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.2 6L14 21H10l-1.8-6C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z"/>
      <path d="M9 21h6"/>
      <path d="M12 12v-2"/>
    </svg>`,
  };

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    injectStyles();
    buildDOM();
    bindEvents();
    setTimeout(initSession, 500);
  }

  function injectStyles() {
    // CSS is loaded via <link> in the template, not injected here
    // This is just a no-op placeholder for self-contained variant
  }

  function buildDOM() {
    // ── Launch Button ──
    launchBtn = document.createElement("button");
    launchBtn.id = "rai-launch-btn";
    launchBtn.setAttribute("aria-label", "Open Rakibul AI");
    launchBtn.innerHTML = `${ICONS.ai}<span class="rai-badge"></span>`;
    document.body.appendChild(launchBtn);

    // ── Chat Panel ──
    panel = document.createElement("div");
    panel.id = "rai-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Rakibul AI Assistant");
    panel.innerHTML = `
      <div class="rai-header">
        <div class="rai-avatar">
          ${ICONS.bot}
          <span class="rai-online-dot"></span>
        </div>
        <div class="rai-header-info">
          <div class="rai-header-name">Rakibul AI</div>
          <div class="rai-header-status">Online · AI Engineering Assistant</div>
        </div>
        <button class="rai-close-btn" aria-label="Close chat">${ICONS.close}</button>
      </div>

      <div class="rai-messages" id="rai-messages" role="log" aria-live="polite">
      </div>

      <div class="rai-input-area">
        <div class="rai-input-row">
          <textarea
            class="rai-textarea"
            id="rai-textarea"
            placeholder="Ask about skills, projects, consulting..."
            rows="1"
            maxlength="${CONFIG.MAX_INPUT_CHARS}"
            aria-label="Message input"
          ></textarea>
          <button class="rai-send-btn" id="rai-send-btn" aria-label="Send message" disabled>
            ${ICONS.send}
          </button>
        </div>
        <div class="rai-footer-note">AI · Represents MD Rakibul Hasan Naym</div>
      </div>
    `;
    document.body.appendChild(panel);

    // Cache refs
    messagesEl = document.getElementById("rai-messages");
    textarea = document.getElementById("rai-textarea");
    sendBtn = document.getElementById("rai-send-btn");
  }

  function bindEvents() {
    // Toggle panel
    launchBtn.addEventListener("click", togglePanel);
    panel.querySelector(".rai-close-btn").addEventListener("click", closePanel);

    // Send on button click
    sendBtn.addEventListener("click", handleSend);

    // Send on Enter (Shift+Enter = newline)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Auto-resize textarea + toggle send button state
    textarea.addEventListener("input", () => {
      autoResizeTextarea();
      updateSendButtonState();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        isOpen &&
        !panel.contains(e.target) &&
        !launchBtn.contains(e.target)
      ) {
        closePanel();
      }
    });

    // Keyboard escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) closePanel();
    });
  }

  // ── Session Management ───────────────────────────────────────
  async function initSession() {
    try {
      const res = await fetch(CONFIG.API_SESSION, { method: "POST" });
      if (!res.ok) throw new Error("Session init failed");
      const data = await res.json();
      sessionId = data.session_id;
    } catch (err) {
      console.warn("Rakibul AI: Session init failed", err);
    }
  }

  // ── Panel Open/Close ─────────────────────────────────────────
  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("rai-open");
    launchBtn.classList.remove("rai-has-notification");

    // Show welcome + suggestions on first open
    if (!hasInteracted) {
      hasInteracted = true;
      setTimeout(() => {
        addWelcomeMessage();
      }, CONFIG.WELCOME_DELAY_MS);
    }

    setTimeout(() => textarea.focus(), 300);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("rai-open");
  }

  // ── Message Sending ──────────────────────────────────────────
  async function handleSend() {
    const text = textarea.value.trim();
    if (!text || isLoading) return;

    if (!sessionId) {
      await initSession();
      if (!sessionId) {
        appendErrorMessage("Connection failed. Please refresh and try again.");
        return;
      }
    }

    // Clear input
    textarea.value = "";
    autoResizeTextarea();
    updateSendButtonState();

    // Append user message
    appendUserMessage(text);
    scrollToBottom();

    // Show typing indicator
    showTypingIndicator();
    setLoading(true);

    // Artificial thinking delay for better UX
    await sleep(CONFIG.TYPING_DELAY_MS);

    try {
      const res = await fetch(CONFIG.API_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      });

      hideTypingIndicator();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.detail || `Error ${res.status}`;
        appendErrorMessage(msg);
      } else {
        const data = await res.json();
        appendAssistantMessage(data.response);
      }
    } catch (err) {
      hideTypingIndicator();
      appendErrorMessage(
        "Network error. Check your connection and try again."
      );
      console.error("Rakibul AI send error:", err);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  // ── Message Rendering ────────────────────────────────────────
  function addWelcomeMessage() {
    appendAssistantMessage(WELCOME_MESSAGE, true);

    // Add suggestion chips after welcome
    const suggestionsEl = document.createElement("div");
    suggestionsEl.className = "rai-suggestions";
    SUGGESTED_QUESTIONS.forEach((q) => {
      const chip = document.createElement("button");
      chip.className = "rai-suggestion-chip";
      chip.textContent = q;
      chip.addEventListener("click", () => {
        textarea.value = q;
        updateSendButtonState();
        handleSend();
        suggestionsEl.remove();
      });
      suggestionsEl.appendChild(chip);
    });
    messagesEl.appendChild(suggestionsEl);
    scrollToBottom();
  }

  function appendUserMessage(text) {
    const el = createMessageEl("user", escapeHtml(text));
    messagesEl.appendChild(el);
  }

  function appendAssistantMessage(text, isWelcome = false) {
    const rendered = renderMarkdown(text);
    const el = createMessageEl("assistant", rendered);
    messagesEl.appendChild(el);
  }

  function appendErrorMessage(text) {
    const el = document.createElement("div");
    el.className = "rai-error-bubble";
    el.textContent = `⚠ ${text}`;
    messagesEl.appendChild(el);
  }

  function createMessageEl(role, htmlContent) {
    const msg = document.createElement("div");
    msg.className = `rai-msg rai-${role}`;

    const icon = document.createElement("div");
    icon.className = "rai-msg-icon";
    icon.innerHTML = role === "assistant" ? ICONS.bot : ICONS.user;

    const content = document.createElement("div");
    content.className = "rai-msg-content";

    const bubble = document.createElement("div");
    bubble.className = "rai-msg-bubble";
    bubble.innerHTML = htmlContent;

    const time = document.createElement("div");
    time.className = "rai-msg-time";
    time.textContent = getTimeString();

    content.appendChild(bubble);
    content.appendChild(time);
    msg.appendChild(icon);
    msg.appendChild(content);

    return msg;
  }

  // ── Typing Indicator ─────────────────────────────────────────
  function showTypingIndicator() {
    typingIndicator = document.createElement("div");
    typingIndicator.className = "rai-typing";
    typingIndicator.innerHTML = `
      <div class="rai-msg-icon">${ICONS.bot}</div>
      <div class="rai-typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesEl.appendChild(typingIndicator);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    if (typingIndicator && typingIndicator.parentNode) {
      typingIndicator.remove();
      typingIndicator = null;
    }
  }

  // ── Utilities ────────────────────────────────────────────────
  function setLoading(state) {
    isLoading = state;
    sendBtn.disabled = state || !textarea.value.trim();
  }

  function updateSendButtonState() {
    const hasText = textarea.value.trim().length > 0;
    sendBtn.disabled = isLoading || !hasText;
    sendBtn.classList.toggle("rai-ready", hasText && !isLoading);
  }

  function autoResizeTextarea() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 50);
  }

  function getTimeString() {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Lightweight markdown renderer.
   * Handles: **bold**, *italic*, `code`, bullet lists, numbered lists.
   * No external dependencies.
   */
  function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks (before inline code)
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
      return `<pre style="background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.15);border-radius:6px;padding:10px 12px;margin:6px 0;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:12px;color:#e8edf5;white-space:pre-wrap;">${code.trim()}</pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Bullet lists
    html = html.replace(/^[-•] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

    // Line breaks (double newline → paragraph, single → <br>)
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<p>${html}</p>`;

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p>(<ul>|<ol>|<pre>)/g, "$1");
    html = html.replace(/(<\/ul>|<\/ol>|<\/pre>)<\/p>/g, "$1");

    return html;
  }

  // ── Bootstrap ────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
