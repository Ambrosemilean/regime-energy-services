"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { role: string; content: string };

const SESSION_KEY = "regi_session_id";

const SUGGESTIONS = [
  "How do I order gas?",
  "What cylinder sizes do you have?",
  "Where are your branches?",
  "How much is a refill?",
  "How long does delivery take?",
  "Gas safety tips",
];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending) return;

      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setInput("");
      setSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            message,
            conversationId,
          }),
        });
        const data = await res.json();

        if (data.reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
          if (data.conversationId) setConversationId(data.conversationId);
          setWhatsappLink(data.escalated ? data.whatsappLink : data.companyWhatsapp || null);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, I couldn't respond right now. Please try again." },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Network error — please check your connection and try again." },
        ]);
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending],
  );

  // Load history on mount
  useEffect(() => {
    if (historyLoaded) return;

    (async () => {
      setHistoryLoaded(true);
      try {
        const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(getSessionId())}`);
        const data = await res.json();
        const history = (data.messages || []).filter(
          (m: Msg) => m.role === "user" || m.role === "assistant",
        );
        if (data.conversationId) setConversationId(data.conversationId);
        if (history.length) {
          setMessages(history);
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Hello! 👋 I'm Regi, the Regime Energy Services assistant. Ask me about gas orders, prices, delivery, cylinder sizes, branches or gas safety.",
            },
          ]);
        }
      } catch {
        setMessages([
          {
            role: "assistant",
            content: "Hello! 👋 I'm Regi. Ask me anything about our gas products and services.",
          },
        ]);
      }
    })();
  }, [historyLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  const showSuggestions = messages.filter((m) => m.role === "user").length === 0;

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "ml-auto rounded-br-md bg-blue-600 text-white"
                : "rounded-bl-md bg-white text-gray-800 shadow-sm"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {sending && (
          <div className="w-28 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm shadow-sm">
            <span className="animate-pulse">Regi is typing…</span>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {showSuggestions && !sending && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-white px-4 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Escalate to WhatsApp */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="border-t border-gray-100 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700 hover:bg-green-100"
        >
          💬{" "}
          {messages.some((m) => m.content.includes("⚠️"))
            ? "Escalate to customer service on WhatsApp"
            : "Continue on WhatsApp"}
        </a>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-3 border-t border-gray-200 bg-white p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about gas, delivery, safety…"
          className="min-w-0 flex-1 rounded-full border border-gray-300 px-5 py-2.5 text-sm outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
