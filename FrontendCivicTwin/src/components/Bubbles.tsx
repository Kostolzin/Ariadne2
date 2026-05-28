import type { ReactNode } from "react";
import { LabyrinthMark } from "./LabyrinthMark";

interface BubbleProps {
  children: ReactNode;
}

export function AriadneBubble({ children }: BubbleProps) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <LabyrinthMark size={22} />
      <div
        style={{
          flex: 1,
          fontSize: 14.5,
          lineHeight: 1.5,
          color: "#1a1f2a",
          background: "#fff",
          border: "1px solid rgba(31,93,74,0.15)",
          borderRadius: "2px 12px 12px 12px",
          padding: "10px 14px",
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children }: BubbleProps) {
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: "82%",
        background: "#1f5d4a",
        color: "#fbf7ee",
        borderRadius: "12px 12px 2px 12px",
        padding: "10px 14px",
        fontSize: 14.5,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </div>
  );
}
