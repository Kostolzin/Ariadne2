import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { AriadneBubble, UserBubble } from "./Bubbles";
import type { ChatMessage } from "../hooks/useAriadne";

interface ChatColumnProps {
  mobile: boolean;
  caseTitle: string;
  caseSubtitle: string;
  messages: ChatMessage[];
  isThinking: boolean;
  suggestions: string[];
  onSend: (message: string) => void;
}

export function ChatColumn({
  mobile,
  caseTitle,
  caseSubtitle,
  messages,
  isThinking,
  suggestions,
  onSend,
}: ChatColumnProps) {
  const [draft, setDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isThinking]);

  const submit = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <section
      style={{
        background: "#f4ede0",
        padding: mobile ? "20px 18px" : "36px 40px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#1f5d4a",
            fontWeight: 600,
          }}
        >
          {caseTitle}
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: mobile ? 28 : 36,
            fontWeight: 400,
            letterSpacing: -0.8,
            lineHeight: 1.1,
            margin: "8px 0 0",
            color: "#0e2024",
          }}
        >
          {caseSubtitle}
        </h1>
      </div>

      <div
        ref={scrollerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 18,
          overflow: "auto",
          flex: 1,
          minHeight: 0,
        }}
      >
        {messages.map((m) =>
          m.from === "ariadne" ? (
            <AriadneBubble key={m.id}>{m.text}</AriadneBubble>
          ) : (
            <UserBubble key={m.id}>{m.text}</UserBubble>
          ),
        )}
        {isThinking && <AriadneBubble>…</AriadneBubble>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            style={{
              background: "transparent",
              border: "1px solid rgba(31,93,74,0.35)",
              color: "#1f5d4a",
              borderRadius: 999,
              padding: "7px 13px",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          border: "1px solid rgba(31,93,74,0.2)",
          borderRadius: 14,
          padding: "10px 12px",
        }}
      >
        <input
          placeholder="Ask Ariadne anything…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            color: "#0e2024",
          }}
        />
        <button style={miniBtn} aria-label="Voice input">
          <Icon name="mic" size={16} />
        </button>
        <button
          onClick={submit}
          style={{ ...miniBtn, background: "#1f5d4a", color: "#f4ede0", border: "none" }}
          aria-label="Send"
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </section>
  );
}

const miniBtn = {
  width: 34,
  height: 34,
  borderRadius: 8,
  background: "transparent",
  border: "1px solid rgba(31,93,74,0.25)",
  display: "grid",
  placeItems: "center",
  color: "#1f5d4a",
  cursor: "pointer",
} as const;
