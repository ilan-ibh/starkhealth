"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, type FormEvent, type ReactNode } from "react";

/* ── Lightweight markdown renderer ──────────────────────────────────────── */

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="my-1.5 space-y-1 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (s: string): ReactNode => {
    // Bold **text** or __text__, then italic *text* or _text_, then inline code
    const parts: ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(s)) !== null) {
      if (match.index > lastIndex) {
        parts.push(s.slice(lastIndex, match.index));
      }
      if (match[2] || match[3]) {
        // Bold
        parts.push(
          <strong key={`b${match.index}`} className="font-medium text-white/90">
            {match[2] || match[3]}
          </strong>
        );
      } else if (match[4] || match[5]) {
        // Italic
        parts.push(
          <em key={`i${match.index}`} className="italic text-white/60">
            {match[4] || match[5]}
          </em>
        );
      } else if (match[6]) {
        // Code
        parts.push(
          <code
            key={`c${match.index}`}
            className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/70"
          >
            {match[6]}
          </code>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < s.length) parts.push(s.slice(lastIndex));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (trimmed === "") {
      flushList();
      continue;
    }

    // Bullet: -, *, •
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      listItems.push(
        <li key={key++} className="flex items-start gap-2">
          <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-white/25" />
          <span>{inlineFormat(bulletMatch[1])}</span>
        </li>
      );
      continue;
    }

    // Numbered list: 1. or 1)
    const numMatch = trimmed.match(/^\d+[.)]\s+(.*)/);
    if (numMatch) {
      listItems.push(
        <li key={key++} className="flex items-start gap-2">
          <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-white/25" />
          <span>{inlineFormat(numMatch[1])}</span>
        </li>
      );
      continue;
    }

    // Regular text
    flushList();
    elements.push(
      <p key={key++} className="my-1">
        {inlineFormat(trimmed)}
      </p>
    );
  }
  flushList();

  return elements;
}

const PROMPTS = [
  "How is my recovery trending this week?",
  "Analyze my sleep patterns",
  "What should I focus on today?",
  "How does my training affect recovery?",
  "Give me a weekly health summary",
  "Tips to improve my HRV",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: Props) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-white/[0.04] bg-[#0a0a0a] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] px-5 py-4">
          <div>
            <h2 className="text-sm font-light tracking-wider text-white/80">
              Health Assistant
            </h2>
            <p className="text-[10px] text-white/25">Powered by Claude</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <p className="text-[13px] leading-relaxed font-light text-white/50">
                  Hi — I&apos;m your health assistant. I have access to your
                  WHOOP and Withings data. Ask me anything about your metrics,
                  trends, or for personalized recommendations.
                </p>
              </div>

              <p className="pt-2 text-[9px] font-medium tracking-[0.2em] text-white/20 uppercase">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-white/[0.06] px-3 py-1.5 text-[11px] font-light text-white/35 transition-all hover:border-white/15 hover:text-white/70"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-white/[0.08] text-white/90"
                      : "border border-white/[0.04] bg-white/[0.02] text-white/70"
                  }`}
                >
                  {m.parts?.map((part, i) =>
                    part.type === "text" ? (
                      <div
                        key={i}
                        className="text-[13px] leading-relaxed font-light"
                      >
                        {m.role === "user" ? (
                          <p className="whitespace-pre-wrap">{part.text}</p>
                        ) : (
                          renderMarkdown(part.text)
                        )}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/[0.04] bg-[#0a0a0a] px-5 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health..."
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-light text-white/80 placeholder-white/20 outline-none transition-colors focus:border-white/15"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-white/[0.08] p-2.5 text-white/60 transition-all hover:bg-white/15 disabled:opacity-20"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8h12M9 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
