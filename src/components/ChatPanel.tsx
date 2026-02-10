"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, type FormEvent, type ReactNode } from "react";

/* ── Markdown renderer ──────────────────────────────────────────────────── */

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) { elements.push(<ul key={key++} className="my-1.5 space-y-1 pl-1">{listItems}</ul>); listItems = []; }
  };

  const inlineFormat = (s: string): ReactNode => {
    const parts: ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(s)) !== null) {
      if (match.index > lastIndex) parts.push(s.slice(lastIndex, match.index));
      if (match[2] || match[3]) parts.push(<strong key={`b${match.index}`} className="font-medium text-t1">{match[2] || match[3]}</strong>);
      else if (match[4] || match[5]) parts.push(<em key={`i${match.index}`} className="italic text-t2">{match[4] || match[5]}</em>);
      else if (match[6]) parts.push(<code key={`c${match.index}`} className="rounded bg-btn px-1.5 py-0.5 text-[11px] text-t2">{match[6]}</code>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < s.length) parts.push(s.slice(lastIndex));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") { flushList(); continue; }
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) { listItems.push(<li key={key++} className="flex items-start gap-2"><span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-t4" /><span>{inlineFormat(bulletMatch[1])}</span></li>); continue; }
    const numMatch = trimmed.match(/^\d+[.)]\s+(.*)/);
    if (numMatch) { listItems.push(<li key={key++} className="flex items-start gap-2"><span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-t4" /><span>{inlineFormat(numMatch[1])}</span></li>); continue; }
    flushList();
    elements.push(<p key={key++} className="my-1">{inlineFormat(trimmed)}</p>);
  }
  flushList();
  return elements;
}

/* ── Chat Panel ─────────────────────────────────────────────────────────── */

const PROMPTS = [
  "How is my recovery trending this week?",
  "Analyze my sleep patterns",
  "What should I focus on today?",
  "How does my training affect recovery?",
  "Give me a weekly health summary",
  "Tips to improve my HRV",
];

interface Props { isOpen: boolean; onClose: () => void; hasApiKey?: boolean; }

export function ChatPanel({ isOpen, onClose, hasApiKey = true }: Props) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  const send = (text: string) => { if (!text.trim() || busy) return; sendMessage({ text }); setInput(""); };
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-overlay backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} />

      <div className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-edge bg-page-s transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-edge px-5 py-4">
          <div>
            <h2 className="text-sm font-light tracking-wider text-t1">Health Assistant</h2>
            <p className="text-[10px] text-t4">Powered by Claude</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-t4 transition-colors hover:bg-btn hover:text-t2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!hasApiKey ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <p className="mt-4 text-sm font-light text-t3">API key required</p>
              <p className="mt-1 max-w-[260px] text-[12px] font-light text-t4">Add your Anthropic API key in Settings to start chatting with the AI assistant.</p>
              <a href="/settings" className="mt-5 rounded-full bg-btn px-5 py-2 text-[11px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h">Go to Settings</a>
            </div>
          ) : messages.length === 0 ? (
            <>
              <div className="rounded-xl border border-edge bg-card p-4">
                <p className="text-[13px] leading-relaxed font-light text-t3">
                  Hi — I&apos;m your health coach. I have access to your WHOOP, Withings, and Hevy data. Ask me about recovery, sleep, training, body composition, or for personalized recommendations.
                </p>
              </div>
              <p className="pt-2 text-[9px] font-medium tracking-[0.2em] text-tm uppercase">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)} className="rounded-full border border-edge px-3 py-1.5 text-[11px] font-light text-t4 transition-all hover:border-edge-h hover:text-t2">{p}</button>
                ))}
              </div>
            </>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-btn text-t1" : "border border-edge bg-card text-t2"}`}>
                  {m.parts?.map((part, i) =>
                    part.type === "text" ? (
                      <div key={i} className="text-[13px] leading-relaxed font-light">
                        {m.role === "user" ? <p className="whitespace-pre-wrap">{part.text}</p> : renderMarkdown(part.text)}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))
          )}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl border border-edge bg-card px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-t4" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-t4" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-t4" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-edge bg-page-s px-5 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your health..."
              className="flex-1 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-light text-t1 placeholder-tm outline-none transition-colors focus:border-edge-h" />
            <button type="submit" disabled={busy || !input.trim()} className="rounded-xl bg-btn p-2.5 text-t3 transition-all hover:bg-btn-h disabled:opacity-20">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
