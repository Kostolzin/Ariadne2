import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  small?: boolean;
}

export function SectionLabel({ children, small }: SectionLabelProps) {
  return (
    <div
      style={{
        fontSize: small ? 10 : 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "#1f5d4a",
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}
