import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, PawPrint } from "lucide-react";
import { SoundWave } from "./SoundWave";
import { Particles, type Particle } from "./Particles";
import catTimeline from "@/assets/cat_state_7.mp4";

type GameState = "idle" | "listening" | "catReacting" | "catMoving" | "success";

const TOTAL_STEPS = 5;
const TARGET_WORDS = ["meow", "miaow", "miaou"];
const DISTANCE_LABELS = ["Far", "Closer", "Near", "Very Close", "Next to Player"];
const IDLE_LOOP_START = 0;
const IDLE_LOOP_END = 15;
const CAT_STATE_TIMESTAMPS = {
  idle: 0,
  1: 17,
  2: 23,
  3: 25,
  4: 30,
  5: 35,
  success: 40,
} as const;

// 1-3 second loop ranges for each state
const STATE_LOOP_RANGES: Record<number | "idle" | "success", [number, number]> = {
  idle: [0, 15],
  1: [17, 20], // 17s + 3s loop
  2: [23, 26], // 23s + 3s loop
  3: [25, 28], // 25s + 3s loop
  4: [30, 33], // 30s + 3s loop
  5: [35, 38], // 35s + 3s loop
  success: [40, 43], // 40s + 3s loop
} as const;

// Phoneme mapping for accent-aware matching
const PHONEME_MAP: Record<string, Set<string>> = {
  oh: new Set(["oh", "eau", "o"]),
  ow: new Set(["ow", "ou", "au"]),
  ee: new Set(["ee", "ea", "ie", "y"]),
  m: new Set(["m", "n"]), // nasal interchange
};

function phonemeDistance(a: string, b: string): number {
  if (a === b) return 0;
  // Check if sounds are phonetically equivalent
  for (const variants of Object.values(PHONEME_MAP)) {
    if (variants.has(a) && variants.has(b)) return 0.5; // Lower cost for phonetic similarity
  }
  return 1;
}

function levenshteinDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = phonemeDistance(a[i - 1], b[j - 1]);
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
}

// Fuzzy pronunciation matcher for common accent variations
function fuzzyPronunciationMatch(spoken: string, target: string): number {
  // Remove consecutive duplicate vowels (handles "meeeow" → "meow")
  const normalize = (s: string) => s.replace(/(a|e|i|o|u)\1+/g, "$1");
  const normSpoken = normalize(spoken);
  const normTarget = normalize(target);

  // Check exact match first
  if (normSpoken === normTarget) return 100;

  // Check for substring match (handles "the meow" → "meow")
  if (normTarget.includes(normSpoken) || normSpoken.includes(normTarget)) return 85;

  const distance = levenshteinDistance(normSpoken, normTarget);
  const maxLen = Math.max(normSpoken.length, normTarget.length);
  const similarity = Math.max(0, ((maxLen - distance) / maxLen) * 100);

  return Math.round(similarity);
}

function getPronunciationScore(transcript: string): number {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 0;

  let best = 0;
  for (const spoken of words) {
    for (const target of TARGET_WORDS) {
      best = Math.max(best, fuzzyPronunciationMatch(spoken, target));
    }
  }

  return best;
}

type SR = any;

export function CallTheCatGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [supported, setSupported] = useState(true);
  const [didntUnderstand, setDidntUnderstand] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [scorePopup, setScorePopup] = useState<string | null>(null);
  const recognitionRef = useRef<SR | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const gameStateRef = useRef<GameState>("idle");

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
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
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const transcript = event.results[i][0].transcript as string;
        const score = getPronunciationScore(transcript);
        handlePronunciation(score);
      }
    };
    rec.onerror = () => {
      setGameState("idle");
      gameStateRef.current = "idle";
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
    const emojis = ["💕", "✨", "💖", "⭐", "🐾"];
    const newOnes: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: baseX + (Math.random() - 0.5) * 240,
      y: baseY + (Math.random() - 0.5) * 110,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles((p) => [...p, ...newOnes]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newOnes.find((n) => n.id === x.id)));
    }, 1500);
  }, []);

  const handlePronunciation = useCallback(
    (score: number) => {
      if (gameStateRef.current !== "listening") return;
      if (progressRef.current >= TOTAL_STEPS) return;

      setLastScore(score);

      // Apply accent-specific confidence boost if high-confidence match
      const boostedScore = Math.min(100, score + (score >= 65 ? 5 : 0));
      const gain = boostedScore >= 90 ? 2 : boostedScore >= 70 ? 1 : boostedScore >= 50 ? 0.5 : 0;
      const popupText =
        boostedScore >= 90
          ? "⭐ Excellent Meow! +2 Steps"
          : boostedScore >= 70
            ? "✨ Great Meow! +1 Step"
            : boostedScore >= 50
              ? "💫 Okay Meow! +Small Progress"
              : "No progress";

      setScorePopup(popupText);
      setTimeout(() => setScorePopup(null), 1400);

      if (gain <= 0) {
        setDidntUnderstand(true);
        setTimeout(() => setDidntUnderstand(false), 2000);
        return;
      }

      setDidntUnderstand(false);
      setGameState("catReacting");
      gameStateRef.current = "catReacting";
      spawnParticles();

      // After reaction pause, increment progress and transition to catMoving
      setTimeout(() => {
        const next = Math.min(TOTAL_STEPS, progressRef.current + gain);
        progressRef.current = next;
        setProgress(next);
        setGameState("catMoving");
        gameStateRef.current = "catMoving";

        // After move animation, resolve to success or back to listening
        setTimeout(() => {
          if (progressRef.current >= TOTAL_STEPS) {
            setGameState("success");
            gameStateRef.current = "success";
            try {
              recognitionRef.current?.stop();
            } catch {}
          } else {
            setGameState("listening");
            gameStateRef.current = "listening";
          }
        }, 800);
      }, 1200);
    },
    [spawnParticles],
  );

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setGameState("listening");
      gameStateRef.current = "listening";
      setDidntUnderstand(false);
    } catch {}
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setGameState("idle");
    gameStateRef.current = "idle";
    setDidntUnderstand(false);
  };

  const reset = () => {
    progressRef.current = 0;
    setProgress(0);
    setGameState("idle");
    gameStateRef.current = "idle";
    setDidntUnderstand(false);
    setLastScore(null);
    setScorePopup(null);
  };

  const isListening = gameState === "listening";
  const isBusy = gameState === "catReacting" || gameState === "catMoving";
  const stage = Math.min(TOTAL_STEPS, Math.floor(progress));

  const feedbackText =
    gameState === "success"
      ? "The cat came to you!"
      : gameState === "catReacting"
        ? "The cat heard you!"
        : gameState === "catMoving"
          ? "The cat is moving closer..."
          : gameState === "listening"
            ? didntUnderstand
              ? "The cat didn't understand"
              : "Listening... say meow"
            : "Press the microphone and call the cat";

  const scoreBand =
    lastScore == null
      ? ""
      : lastScore >= 90
        ? "Excellent"
        : lastScore >= 70
          ? "Good"
          : lastScore >= 50
            ? "Okay"
            : "Not recognized";

  const currentLabel =
    DISTANCE_LABELS[Math.min(stage, DISTANCE_LABELS.length - 1)] ?? "Next to Player";
  const currentTimestamp =
    gameState === "success"
      ? CAT_STATE_TIMESTAMPS.success
      : stage === 0
        ? CAT_STATE_TIMESTAMPS.idle
        : CAT_STATE_TIMESTAMPS[Math.min(stage, TOTAL_STEPS) as 1 | 2 | 3 | 4 | 5];

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const seekAndPlay = () => {
      videoEl.currentTime = currentTimestamp;
      void videoEl.play().catch(() => {});
    };

    if (videoEl.readyState >= 1) {
      seekAndPlay();
      return;
    }

    videoEl.addEventListener("loadedmetadata", seekAndPlay, { once: true });
    return () => {
      videoEl.removeEventListener("loadedmetadata", seekAndPlay);
    };
  }, [currentTimestamp]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const constrainToStateLoop = () => {
      const loopKey = gameState === "success" ? "success" : stage || "idle";
      const [loopStart, loopEnd] = STATE_LOOP_RANGES[loopKey] || [0, 15];

      if (videoEl.currentTime >= loopEnd) {
        videoEl.currentTime = loopStart;
        void videoEl.play().catch(() => {});
      } else if (videoEl.currentTime < loopStart) {
        videoEl.currentTime = loopStart;
        void videoEl.play().catch(() => {});
      }
    };

    videoEl.addEventListener("timeupdate", constrainToStateLoop);
    return () => {
      videoEl.removeEventListener("timeupdate", constrainToStateLoop);
    };
  }, [gameState, stage]);

  return (
    <div className="relative min-h-screen w-full font-game text-white overflow-hidden bg-black">
      {/* Full-bleed video */}
      <motion.video
        ref={videoRef}
        src={catTimeline}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ scale: 1.02 + (progress / TOTAL_STEPS) * 0.08 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Brief flash when cat reacts */}
      <AnimatePresence>
        {gameState === "catReacting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.22, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute inset-0 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />

      {/* Warm bottom grade */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--pink) 35%, transparent), transparent 55%)",
        }}
        animate={{ opacity: gameState === "success" ? 0.85 : 0.35 }}
        transition={{ duration: 0.6 }}
      />

      {/* Top / bottom fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Particle anchor */}
      <div ref={sceneRef} className="absolute inset-0">
        <Particles items={particles} />
      </div>

      {/* ── UI Layer ── */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-5">
        {/* Header */}
        <header className="text-center pt-2">
          <h1
            className="text-3xl sm:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            style={{ color: "oklch(0.95 0.05 80)" }}
          >
            <PawPrint className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: "var(--sun)" }} />
            Call The Cat
          </h1>
          <p className="text-sm sm:text-base text-white/80 mt-1 drop-shadow">
            Use your voice to call the kitty home
          </p>
        </header>

        {/* Score popup */}
        <AnimatePresence>
          {scorePopup && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="mt-3 mx-auto w-fit px-4 py-2 rounded-full bg-black/60 border border-white/20 text-sm font-semibold"
            >
              {scorePopup}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback status pill */}
        <div className="mt-4 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={feedbackText}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 shadow-lg"
            >
              {isListening && <SoundWave active />}
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    gameState === "catReacting"
                      ? "oklch(0.9 0.15 80)"
                      : didntUnderstand
                        ? "oklch(0.75 0.15 25)"
                        : "white",
                }}
              >
                {feedbackText}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Push controls to bottom */}
        <div className="flex-1" />

        {/* Bottom controls */}
        <div className="pb-3">
          <AnimatePresence mode="wait">
            {gameState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-5"
              >
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="text-2xl sm:text-3xl font-extrabold drop-shadow-lg text-center"
                  style={{ color: "oklch(0.95 0.08 80)" }}
                >
                  🎉 The cat came to you!
                </motion.p>
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
                  disabled={!supported || isBusy}
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
                    {isListening
                      ? "The cat is waiting for your call..."
                      : "Tap the mic, then meow softly"}
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
        </div>
      </div>
    </div>
  );
}
