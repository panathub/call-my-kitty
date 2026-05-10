import { motion } from "framer-motion";

interface CatProps {
  walking: boolean;
  celebrating: boolean;
}

export function Cat({ walking, celebrating }: CatProps) {
  return (
    <motion.div
      animate={celebrating ? { y: [0, -24, 0, -16, 0] } : {}}
      transition={{ duration: 0.8, repeat: celebrating ? Infinity : 0 }}
      className={walking ? "animate-cat-walk" : ""}
    >
      <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
        {/* Tail */}
        <g style={{ transformOrigin: "20px 55px" }} className="animate-tail-wag">
          <path
            d="M20 55 Q5 50 8 30"
            stroke="oklch(0.55 0.05 50)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        {/* Body */}
        <ellipse cx="45" cy="55" rx="28" ry="20" fill="oklch(0.7 0.07 60)" />
        {/* Head */}
        <circle cx="62" cy="38" r="18" fill="oklch(0.75 0.07 60)" />
        {/* Ears */}
        <polygon points="50,28 52,15 60,24" fill="oklch(0.7 0.07 60)" />
        <polygon points="74,28 76,15 68,24" fill="oklch(0.7 0.07 60)" />
        <polygon points="52,24 54,18 58,23" fill="oklch(0.85 0.08 20)" />
        <polygon points="72,24 74,18 70,23" fill="oklch(0.85 0.08 20)" />
        {/* Eyes */}
        <circle cx="56" cy="38" r="2.5" fill="#222" />
        <circle cx="68" cy="38" r="2.5" fill="#222" />
        <circle cx="57" cy="37" r="0.8" fill="#fff" />
        <circle cx="69" cy="37" r="0.8" fill="#fff" />
        {/* Nose & mouth */}
        <path d="M62 43 l-2 1 l2 1 l2 -1 z" fill="oklch(0.7 0.18 0)" />
        <path d="M62 45 q-2 3 -4 2 M62 45 q2 3 4 2" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Whiskers */}
        <line x1="48" y1="44" x2="40" y2="42" stroke="#444" strokeWidth="0.8" />
        <line x1="48" y1="46" x2="40" y2="46" stroke="#444" strokeWidth="0.8" />
        <line x1="76" y1="44" x2="84" y2="42" stroke="#444" strokeWidth="0.8" />
        <line x1="76" y1="46" x2="84" y2="46" stroke="#444" strokeWidth="0.8" />
        {/* Legs */}
        <rect x="32" y="68" width="6" height="10" rx="3" fill="oklch(0.7 0.07 60)" />
        <rect x="52" y="68" width="6" height="10" rx="3" fill="oklch(0.7 0.07 60)" />
      </svg>
    </motion.div>
  );
}
