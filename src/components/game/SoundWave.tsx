import { motion } from "framer-motion";

export function SoundWave({ active }: { active: boolean }) {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div className="flex h-10 items-center justify-center gap-1">
      {bars.map((i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-primary"
          animate={
            active
              ? { height: [8, 28 - Math.abs(3 - i) * 4, 8] }
              : { height: 6 }
          }
          transition={{
            duration: 0.6,
            repeat: active ? Infinity : 0,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
