import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, Heart, PawPrint, Lightbulb } from "lucide-react";
import { SoundWave } from "./SoundWave";
import { Particles, type Particle } from "./Particles";
import catScene from "@/assets/cat-scene.mp4.asset.json";

type GameState = "idle" | "listening" | "catMoving" | "success";

const TOTAL_STEPS = 5;
const MEOW_REGEX = /\b(meow+|miaow+|miaou+|miau+|mew+|miao+)\b/i;

type SR = any;

export function CallTheCatGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [steps, setSteps] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [supported, setSupported] = useState(true);
  const [hint, setHint] = useState<string | null>(null);
  const recognitionRef = useRef<SR | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef(0);
  const gameStateRef = useRef<GameState>("idle");

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const rec: SR = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript as string;
        if (MEOW_REGEX.test(transcript)) {
          handleMeow();
        } else if (event.results[i].isFinal) {
          setHint("The cat didn't understand 🙁");
        }
      }
    };
    rec.onerror = () => {
      setHint("Mic error — try again");
      setGameState("idle");
    };
    rec.onend = () => {
      if (gameStateRef.current === "listening") {
        try {
          rec.start();
        } catch {}
      }
    };
    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spawnParticles = useCallback(() => {
    const rect = sceneRef.current?.getBoundingClientRect();
    const baseX = rect ? rect.width * 0.5 : 200;
    const baseY = rect ? rect.height * 0.55 : 200;
    const emojis = ["💕", "✨", "💖", "⭐"];
    const newOnes: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: baseX + (Math.random() - 0.5) * 200,
      y: baseY + (Math.random() - 0.5) * 80,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles((p) => [...p, ...newOnes]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newOnes.find((n) => n.id === x.id)));
    }, 1300);
  }, []);

  const handleMeow = useCallback(() => {
    if (stepsRef.current >= TOTAL_STEPS) return;
    setHint("The cat heard you! 😻");
    spawnParticles();
    setGameState("catMoving");
    setSteps((s) => {
      const next = Math.min(TOTAL_STEPS, s + 1);
      if (next >= TOTAL_STEPS) {
        setTimeout(() => {
          setGameState("success");
          setHint("The cat came to you! 🎉");
          try {
            recognitionRef.current?.stop();
          } catch {}
        }, 600);
      } else {
        setTimeout(() => {
          if (gameStateRef.current === "catMoving") {
            setGameState("listening");
            setHint(null);
          }
        }, 700);
      }
      return next;
    });
  }, [spawnParticles]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setGameState("listening");
      setHint(null);
    } catch {}
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setGameState("idle");
    setHint(null);
  };

  const reset = () => {
    setSteps(0);
    setGameState("idle");
    setHint(null);
  };

  const isListening = gameState === "listening";
  const subtitle =
    gameState === "success"
      ? "You called the cat home 💗"
      : isListening
        ? "The cat is waiting for your call..."
        : hint ?? "Tap the mic, then meow softly";

  return (
    <div className="relative min-h-screen w-full font-game text-white overflow-hidden bg-black">
      {/* Cinematic full-bleed video */}
      <motion.video
        src={catScene.url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ scale: 1.02 + (steps / TOTAL_STEPS) * 0.1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {/* Vignette + warm grade */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--pink) 35%, transparent), transparent 55%)",
        }}
        animate={{ opacity: gameState === "success" ? 0.85 : 0.35 }}
        transition={{ duration: 0.6 }}
      />
      {/* Top fade for legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Scene anchor for particles */}
      <div ref={sceneRef} className="absolute inset-0">
        <Particles items={particles} />
      </div>

      {/* === UI Layer === */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-5">
        {/* Title */}
        <header className="text-center pt-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
              style={{ color: "oklch(0.95 0.05 80)" }}>
            <PawPrint className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: "var(--sun)" }} />
            Call The Cat
          </h1>
          <p className="text-sm sm:text-base text-white/80 mt-1 drop-shadow">
            Use your voice to call the kitty home
          </p>
        </header>

        {/* Top floating cards */}
        <div className="mt-5 flex justify-between items-start gap-3">
          {/* Goal card */}
          <div className="rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 px-4 py-3 flex items-start gap-3 shadow-lg max-w-[55%]">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" style={{ color: "var(--pink)" }} fill="currentColor" />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-wider text-white/60">Goal</div>
              <div className="text-sm sm:text-base font-bold">Call the cat {TOTAL_STEPS} times</div>
              <div className="text-xs text-white/65">to make it come to you</div>
            </div>
          </div>

          {/* Progress card */}
          <div className="rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <PawPrint className="w-5 h-5" style={{ color: "var(--pink-soft)" }} />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-wider text-white/60">Progress</div>
              <div className="text-xl font-extrabold tabular-nums">
                {steps} <span className="text-white/50 text-base font-bold">/ {TOTAL_STEPS}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Listening pill */}
        <div className="mt-5 flex justify-center">
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 shadow-lg"
              >
                <SoundWave active />
                <span className="text-sm font-semibold">Listening...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* spacer pushing controls to bottom */}
        <div className="flex-1" />

        {/* Bottom controls */}
        <div className="pb-3">
          <AnimatePresence mode="wait">
            {gameState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold shadow-2xl active:scale-95 transition-transform"
                >
                  <RotateCcw size={20} /> Play Again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="mic-bar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-2xl rounded-full bg-black/55 backdrop-blur-md border border-white/10 shadow-2xl pl-2 pr-3 py-2 flex items-center gap-3"
              >
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!supported}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center text-primary-foreground shadow-lg disabled:opacity-50 active:scale-95 transition-transform ${
                    isListening ? "animate-mic-pulse" : ""
                  }`}
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 60%, var(--pink-soft)))",
                  }}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
                >
                  <Mic size={24} />
                </button>

                <div className="flex-1 leading-tight">
                  <div className="text-sm sm:text-base font-bold">
                    {supported
                      ? `Say "meow", "miaow" or "miaou"`
                      : "Speech recognition not supported"}
                  </div>
                  <div className="text-xs sm:text-sm" style={{ color: "var(--pink-soft)" }}>
                    {subtitle}
                  </div>
                </div>

                <button
                  onClick={stopListening}
                  disabled={!isListening}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/90 disabled:opacity-40 transition-colors"
                  aria-label="Mute"
                >
                  <MicOff size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center mt-3 text-xs sm:text-sm text-white/70 flex items-center justify-center gap-1.5">
            <Lightbulb className="w-4 h-4" style={{ color: "var(--sun)" }} />
            <span><span className="font-bold">Tip:</span> Try a clear and cute meow!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
