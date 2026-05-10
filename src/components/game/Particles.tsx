import { AnimatePresence, motion } from "framer-motion";

export interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export function Particles({ items }: { items: Particle[] }) {
  return (
    <AnimatePresence>
      {items.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{ opacity: 0, y: -80, scale: 1.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ position: "absolute", left: p.x, top: p.y, pointerEvents: "none" }}
          className="text-2xl select-none"
        >
          {p.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
