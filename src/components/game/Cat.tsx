import { motion } from "framer-motion";

interface CatProps {
  walking: boolean;
  celebrating: boolean;
}

/**
 * Cinematic back-view of a large cat sitting and looking into the scene.
 * No face shown — only silhouette of ears, head, rounded back and curled tail.
 */
export function Cat({ walking, celebrating }: CatProps) {
  return (
    <motion.div
      animate={
        celebrating
          ? { y: [0, -10, 0, -6, 0] }
          : walking
            ? { y: [0, -2, 0] }
            : { y: [0, -1.5, 0] }
      }
      transition={{
        duration: celebrating ? 0.9 : walking ? 0.5 : 3.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.25))" }}
    >
      <svg
        width="320"
        height="360"
        viewBox="0 0 320 360"
        fill="none"
        className="block"
      >
        <defs>
          <linearGradient id="catFur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.45 0.05 50)" />
            <stop offset="60%" stopColor="oklch(0.32 0.04 45)" />
            <stop offset="100%" stopColor="oklch(0.22 0.03 40)" />
          </linearGradient>
          <radialGradient id="rim" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor="oklch(0.95 0.08 80 / 0.55)" />
            <stop offset="100%" stopColor="oklch(0.95 0.08 80 / 0)" />
          </radialGradient>
        </defs>

        {/* Curled tail wrapping around the side */}
        <g style={{ transformOrigin: "240px 300px" }} className="animate-tail-wag">
          <path
            d="M235 300 Q295 295 300 240 Q302 205 270 215"
            stroke="url(#catFur)"
            strokeWidth="22"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Body — sitting silhouette from behind */}
        <path
          d="M70 340
             C 60 240, 90 170, 160 170
             C 230 170, 260 240, 250 340
             Z"
          fill="url(#catFur)"
        />

        {/* Head */}
        <ellipse cx="160" cy="140" rx="78" ry="68" fill="url(#catFur)" />

        {/* Ears (triangular, perked up) */}
        <path d="M95 95 L110 30 L150 90 Z" fill="url(#catFur)" />
        <path d="M225 95 L210 30 L170 90 Z" fill="url(#catFur)" />
        {/* Inner ear shadow */}
        <path d="M115 75 L122 45 L138 80 Z" fill="oklch(0.28 0.04 40)" opacity="0.7" />
        <path d="M205 75 L198 45 L182 80 Z" fill="oklch(0.28 0.04 40)" opacity="0.7" />

        {/* Subtle spine / fur shading */}
        <path
          d="M160 175 C 150 230, 152 285, 158 335"
          stroke="oklch(0.18 0.02 40)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
          fill="none"
        />

        {/* Rim light from sky */}
        <ellipse cx="160" cy="120" rx="90" ry="70" fill="url(#rim)" />
      </svg>
    </motion.div>
  );
}
