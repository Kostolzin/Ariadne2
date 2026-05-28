export function MiniMap() {
  return (
    <svg
      viewBox="0 0 300 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <rect width="300" height="100" fill="#eee5d2" />
      <g fill="#dcd0b4">
        <rect x="0" y="0" width="60" height="40" />
        <rect x="80" y="0" width="80" height="30" />
        <rect x="180" y="0" width="60" height="50" />
        <rect x="260" y="0" width="60" height="40" />
        <rect x="0" y="60" width="50" height="40" />
        <rect x="70" y="50" width="90" height="50" />
        <rect x="180" y="70" width="80" height="30" />
        <rect x="280" y="60" width="40" height="40" />
      </g>
      <rect x="180" y="0" width="60" height="50" fill="#cfd9b8" />
      <path
        d="M30 90 Q 80 60 130 55 T 240 30"
        fill="none"
        stroke="#c87a6a"
        strokeWidth="2"
        strokeDasharray="3 4"
        strokeLinecap="round"
      />
      <circle cx="30" cy="90" r="5" fill="#1f5d4a" stroke="#fff" strokeWidth="2" />
      <circle cx="240" cy="30" r="6" fill="#c87a6a" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
