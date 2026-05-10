export function Player() {
  return (
    <svg width="70" height="110" viewBox="0 0 70 110" fill="none">
      {/* Legs */}
      <rect x="25" y="75" width="8" height="25" rx="3" fill="oklch(0.45 0.1 260)" />
      <rect x="37" y="75" width="8" height="25" rx="3" fill="oklch(0.45 0.1 260)" />
      {/* Body */}
      <rect x="20" y="45" width="30" height="35" rx="10" fill="oklch(0.75 0.14 350)" />
      {/* Arms */}
      <rect x="10" y="48" width="8" height="22" rx="4" fill="oklch(0.85 0.08 60)" />
      <rect x="52" y="48" width="8" height="22" rx="4" fill="oklch(0.85 0.08 60)" />
      {/* Head */}
      <circle cx="35" cy="28" r="18" fill="oklch(0.88 0.07 60)" />
      {/* Hair */}
      <path d="M18 25 Q35 5 52 25 Q50 18 35 14 Q20 18 18 25 Z" fill="oklch(0.35 0.06 50)" />
      {/* Eyes */}
      <circle cx="29" cy="30" r="2" fill="#222" />
      <circle cx="41" cy="30" r="2" fill="#222" />
      {/* Smile */}
      <path d="M30 36 Q35 40 40 36" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="26" cy="34" r="2" fill="oklch(0.8 0.12 20)" opacity="0.6" />
      <circle cx="44" cy="34" r="2" fill="oklch(0.8 0.12 20)" opacity="0.6" />
    </svg>
  );
}
