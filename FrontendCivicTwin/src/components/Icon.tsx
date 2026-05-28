import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "send"
  | "mic"
  | "check"
  | "walk"
  | "pin"
  | "clock"
  | "chevron"
  | "map"
  | "doc"
  | "cal"
  | "sparkle"
  | "shield"
  | "back";

const PATHS: Record<IconName, ReactNode> = {
  send: <path d="M3 12 L21 4 L13 21 L11 13 Z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  walk: (
    <>
      <circle cx="13" cy="4" r="1.5" />
      <path d="M10 21l2-6-3-3 2-5 4 3 3 1 M9 12l-4 8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
  map: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l5 5v13H7Z" />
      <path d="M14 3v5h5" />
    </>
  ),
  cal: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  sparkle: (
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  back: <path d="M15 6l-6 6 6 6" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, stroke = 1.6, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
