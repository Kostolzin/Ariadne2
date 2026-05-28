interface LabyrinthMarkProps {
  size?: number;
  color?: string;
}

export function LabyrinthMark({
  size = 28,
  color = "#1f5d4a",
}: LabyrinthMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="32" height="32" rx="3" />
      <path d="M10 10h20v20" />
      <path d="M10 14v16h16" />
      <path d="M14 18h12v8" />
      <path d="M14 22v4h8" />
      <circle cx="20" cy="22" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}
