import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, RotateCcw } from "lucide-react";
import { Cat } from "./Cat";
import { SoundWave } from "./SoundWave";
import { Particles, type Particle } from "./Particles";

type GameState = "idle" | "listening" | "catMoving" | "success";

const TOTAL_STEPS = 5;
const MEOW_REGEX = /\b(meow+|miaow+|miaou+|miau+|mew+|miao+)\b/i;

// Minimal type for the SpeechRecognition API
type SR = any;

export function CallTheCatGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState("Press the microphone and call the cat");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SR | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef(0);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

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
          setStatus("The cat didn't understand 🙁");
        }
      }
    };
    rec.onerror = () => {
      setStatus("Mic error — try again");
      setGameState("idle");
    };
    rec.onend = () => {
      // auto-restart while listening
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

  // mirror state in ref for recognition callbacks
  const gameStateRef = useRef<GameState>("idle");
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const spawnParticles = useCallback(() => {
    const rect = sceneRef.current?.getBoundingClientRect();
    const baseX = rect ? rect.width * 0.4 : 200;
    const baseY = rect ? rect.height * 0.55 : 200;
    const emojis = ["💕", "✨", "💖", "⭐"];
    const newOnes: Particle[] = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: baseX + (Math.random() - 0.5) * 120,
      y: baseY + (Math.random() - 0.5) * 40,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles((p) => [...p, ...newOnes]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newOnes.find((n) => n.id === x.id)));
    }, 1300);
  }, []);

  const handleMeow = useCallback(() => {
    if (stepsRef.current >= TOTAL_STEPS) return;
    setStatus("The cat heard you! 😻");
    spawnParticles();
    setGameState("catMoving");
    setSteps((s) => {
      const next = Math.min(TOTAL_STEPS, s + 1);
      if (next >= TOTAL_STEPS) {
        setTimeout(() => {
          setGameState("success");
          setStatus("The cat came to you! 🎉");
          try {
            recognitionRef.current?.stop();
          } catch {}
        }, 600);
      } else {
        setTimeout(() => {
          if (gameStateRef.current === "catMoving") {
            setGameState("listening");
            setStatus("Listening... say meow");
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
      setStatus("Listening... say meow");
    } catch {
      // already started
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setGameState("idle");
    setStatus("Press the microphone and call the cat");
  };

  const reset = () => {
    setSteps(0);
    setGameState("idle");
    setStatus("Press the microphone and call the cat");
  };

  // Cat position: 0 steps = 5% from left; full = 60% (next to player)
  const catPercent = 5 + (steps / TOTAL_STEPS) * 55;

  return (
    <div className="min-h-screen w-full bg-sky-scene font-game text-foreground flex flex-col">
      {/* Header */}
      <header className="px-4 pt-6 pb-3 text-center">
        <h1 className="text-3xl sm:text-4xl tracking-tight drop-shadow-sm">
          🐱 Call The Cat
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Use your voice to call the kitty home
        </p>
      </header>

      {/* Scene */}
      <div className="flex-1 flex items-center justify-center px-3">
        <div
          ref={sceneRef}
          className="relative w-full max-w-3xl h-[55vh] min-h-[340px] rounded-3xl overflow-hidden shadow-xl bg-sky-scene border-4 border-white/60"
        >
          {/* Sun — low, behind the cat for backlight */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-56 h-56 rounded-full"
            style={{
              bottom: "28%",
              background: "radial-gradient(circle, var(--sun) 0%, transparent 70%)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-20 h-20 rounded-full"
            style={{ bottom: "36%", background: "var(--sun)", boxShadow: "0 0 60px var(--sun)" }}
          />

          {/* Distant clouds */}
          <motion.div
            className="absolute top-8 left-8 text-3xl opacity-70"
            animate={{ x: [0, 18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            ☁️
          </motion.div>
          <motion.div
            className="absolute top-12 right-10 text-2xl opacity-60"
            animate={{ x: [0, -14, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          >
            ☁️
          </motion.div>

          {/* Grass / ground */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-grass-scene">
            <div className="absolute inset-x-0 top-0 h-2 bg-white/30" />
          </div>

          {/* The big cat — centered, sitting behind the scene */}
          <motion.div
            className="absolute left-1/2 bottom-0"
            style={{ x: "-50%" }}
            animate={{ scale: 1 + (steps / TOTAL_STEPS) * 0.18 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <Cat
              walking={gameState === "catMoving"}
              celebrating={gameState === "success"}
            />
          </motion.div>

          {/* Particles */}
          <Particles items={particles} />

          {/* Success overlay */}
          {gameState === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-x-0 top-6 mx-auto w-fit px-5 py-2 rounded-full bg-white/90 shadow-lg"
              style={{ color: "var(--pink)" }}
            >
              The cat came to you! 🎉
            </motion.div>
          )}
        </div>
      </div>

      {/* Distance bar */}
      <div className="px-4 pt-4 max-w-3xl mx-auto w-full">
        <div className="flex justify-between text-xs text-foreground/60 mb-1">
          <span>🐾 Cat</span>
          <span>{steps} / {TOTAL_STEPS}</span>
          <span>You 🧍</span>
        </div>
        <div className="h-3 rounded-full bg-white/70 overflow-hidden border border-white">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(to right, var(--pink-soft), var(--primary))" }}
            animate={{ width: `${(steps / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-6 max-w-3xl mx-auto w-full flex flex-col items-center gap-4">
        <SoundWave active={gameState === "listening"} />
        <p className="text-center text-sm sm:text-base min-h-[1.5em] text-foreground/80">
          {supported ? status : "Speech recognition not supported in this browser. Try Chrome."}
        </p>

        {gameState === "success" ? (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          >
            <RotateCcw size={18} /> Play Again
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={startListening}
              disabled={!supported || gameState === "listening"}
              className={`flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg disabled:opacity-50 active:scale-95 transition-transform ${
                gameState === "listening" ? "animate-mic-pulse" : ""
              }`}
              aria-label="Start listening"
            >
              <Mic size={28} />
            </button>
            <button
              onClick={stopListening}
              disabled={gameState !== "listening"}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-foreground shadow disabled:opacity-40 active:scale-95 transition-transform"
              aria-label="Stop listening"
            >
              <MicOff size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
