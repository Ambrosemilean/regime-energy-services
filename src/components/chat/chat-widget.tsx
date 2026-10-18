
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type ApiMessage = {
  role?: unknown;
  content?: unknown;
};

const SESSION_KEY = "regi_session_id";

const WELCOME_MESSAGE: Msg = {
  role: "assistant",
  content:
    "Hello! 👋 I'm Regi, the Regime Energy Services assistant. Ask me about gas orders, prices, delivery, cylinder sizes, branches or gas safety.",
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(SESSION_KEY);

  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }

  return id;
}

// Validate conversation history before it enters React state.
function normalizeMessages(value: unknown): Msg[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: ApiMessage) => {
    if (
      !item ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string"
    ) {
      return [];
    }

    return [
      {
        role: item.role,
        content: item.content,
      },
    ];
  });
}

function containsEscalationWarning(messages: Msg[]): boolean {
  return messages.some((message) => message.content.includes("⚠️"));
}

function RegiAvatar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-800 text-sm font-bold text-white shadow ${className}`}
    >
      R
    </span>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const historyLoadingRef = useRef(false);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();

      if (!message || sending) return;

      setMessages((previous) => [
        ...previous,
        { role: "user", content: message },
      ]);
      setInput("");
      setSending(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            message,
            conversationId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "The chat request failed.");
        }

        if (typeof data.reply === "string" && data.reply.trim()) {
          setMessages((previous) => [
            ...previous,
            { role: "assistant", content: data.reply },
          ]);

          if (data.conversationId) {
            setConversationId(data.conversationId);
          }

          const nextWhatsAppLink = data.escalated
            ? data.whatsappLink
            : data.companyWhatsapp;

          setWhatsappLink(
            typeof nextWhatsAppLink === "string" && nextWhatsAppLink.trim()
              ? nextWhatsAppLink
              : null
          );
        } else {
          setMessages((previous) => [
            ...previous,
            {
              role: "assistant",
              content:
                "Sorry, I couldn't respond right now. Please try again.",
            },
          ]);
        }
      } catch {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              "Network error — please check your connection and try again.",
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending]
  );

  // Load saved history when the chat is first opened.
  useEffect(() => {
    if (!open || historyLoaded || historyLoadingRef.current) return;

    let cancelled = false;

    async function loadHistory() {
      historyLoadingRef.current = true;
      setHistoryLoading(true);

      try {
        const response = await fetch(
          `/api/chat?sessionId=${encodeURIComponent(getSessionId())}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Unable to load chat history.");
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        const savedMessages = normalizeMessages(data.messages);

        setMessages(
          savedMessages.length > 0 ? savedMessages : [WELCOME_MESSAGE]
        );

        setHistoryLoaded(true);
      } catch {
        if (!cancelled) {
          setMessages((previous) =>
            previous.length > 0 ? previous : [WELCOME_MESSAGE]
          );

          // Keep historyLoaded false so reopening the chat can retry.
        }
      } finally {
        historyLoadingRef.current = false;

        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [open, historyLoaded]);

  // Keep the latest messages visible.
  useEffect(() => {
    const container = scrollRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sending]);

  const showEscalation = containsEscalationWarning(messages);

  return (
    <>
      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-900/30 ring-1 ring-white/20 transition-all duration-200 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300/50"
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.9 3 3 6.5 3 11c0 2.4 1.2 4.5 3.1 6-.1 1-.6 2.4-1.7 3.5 0 0 2.9-.2 5-1.9.8.2 1.7.4 2.6.4 5.1 0 9-3.5 9-8s-3.9-8-9-8zm-4 9a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 8 12zm4 0a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 12 12zm4 0a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 16 12z" />
          </svg>
        )}

        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-4 w-4 animate-ping rounded-full bg-green-400/70" />
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(32rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2.5rem))] animate-[chat-in_0.2s_ease-out] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-900/20">
          {/* Fixed header */}
          <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-blue-700 via-blue-700 to-blue-600 px-4 py-3 text-white">
            <RegiAvatar className="ring-2 ring-white/30" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Regi — Chat Assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-2 w-2 animate-ping rounded-full bg-green-400/80" />
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                </span>
                Online · Regime Energy Services
              </p>
            </div>

            <Link
              href="/chat"
              className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
              onClick={() => setOpen(false)}
            >
              Full chat ↗
            </Link>
          </div>

          {/* Scrollable conversation area */}
          <div
            ref={scrollRef}
            aria-live="polite"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/60 p-4"
          >
            {historyLoading && messages.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RegiAvatar className="h-7 w-7 text-xs" />
                <span className="animate-pulse">Loading conversation…</span>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={`${index}-${msg.role}`}
                className={`flex items-end gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <RegiAvatar className="h-7 w-7 text-xs" />
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                    msg.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                      : "rounded-bl-md border border-gray-100 bg-white text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-end gap-2">
                <RegiAvatar className="h-7 w-7 text-xs" />
                <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp escalation */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center justify-center gap-2 border-t border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:from-green-100 hover:to-emerald-100"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.014-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              {showEscalation
                ? "Escalate to customer service on WhatsApp"
                : "Continue on WhatsApp"}
            </a>
          )}

          {/* Message input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about gas, delivery, safety…"
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow transition hover:from-blue-500 hover:to-blue-600 disabled:opacity-40"
              aria-label="Send message"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}