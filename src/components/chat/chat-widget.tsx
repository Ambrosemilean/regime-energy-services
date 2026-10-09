"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SESSION_KEY = "regi_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
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

  // Load history on first open
  useEffect(() => {
    if (!open || historyLoaded) return;

    (async () => {
      setHistoryLoaded(true);
      try {
        const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(getSessionId())}`);
        const data = await res.json();
        if (data.conversationId) {
          setConversationId(data.conversationId);
          setMessages(data.messages || []);
        }
        if (!data.messages?.length) {
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
  }, [open, historyLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  return (
    <>
      {/* Floating bubble — appears on every page */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg shadow-blue-900/30 transition hover:scale-105 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.9 3 3 6.5 3 11c0 2.4 1.2 4.5 3.1 6-.1 1-.6 2.4-1.7 3.5 0 0 2.9-.2 5-1.9.8.2 1.7.4 2.6.4 5.1 0 9-3.5 9-8s-3.9-8-9-8zm-4 9a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 8 12zm4 0a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 12 12zm4 0a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 16 12z" />
          </svg>
        )}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-700 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Regi — Chat Assistant</p>
              <p className="text-xs text-blue-100">Regime Energy Services · Online</p>
            </div>
            <Link
              href="/chat"
              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-500"
              onClick={() => setOpen(false)}
            >
              Full chat ↗
            </Link>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-white text-gray-800 shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {sending && (
              <div className="w-20 rounded-xl bg-white px-3.5 py-2.5 text-sm shadow-sm">
                <span className="animate-pulse">Regi is typing…</span>
              </div>
            )}
          </div>

          {/* Escalate to WhatsApp */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="border-t border-gray-100 bg-green-50 px-4 py-2 text-center text-sm font-semibold text-green-700 hover:bg-green-100"
            >
              💬 {messages.some((m) => m.content.includes("⚠️")) ? "Escalate to customer service on WhatsApp" : "Continue on WhatsApp"}
            </a>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-gray-200 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about gas, delivery, safety…"
              className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-blue-800"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
