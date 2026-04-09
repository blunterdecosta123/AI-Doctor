import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Gauge, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const DARK = "#323232";
const CREAM = "#F7F1EC";
const TILE_IDLE_BG = "linear-gradient(180deg, rgba(255,249,242,0.98), rgba(232,220,207,0.98))";

const DIFFICULTIES = [
  {
    id: "gentle",
    label: "Gentle",
    description: "Slower rhythm and shorter recall chains.",
    flashDuration: 720,
    pauseDuration: 220,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "A steadier pace for everyday focus practice.",
    flashDuration: 560,
    pauseDuration: 180,
  },
  {
    id: "sharp",
    label: "Sharp",
    description: "Quicker flashes for stronger pattern recall.",
    flashDuration: 420,
    pauseDuration: 150,
  },
];

const TILES = [
  {
    id: 0,
    name: "Sun",
    base: "linear-gradient(180deg, #E7B96A, #C88D44)",
    glow: "0 18px 34px rgba(200,141,68,0.36)",
  },
  {
    id: 1,
    name: "Dune",
    base: "linear-gradient(180deg, #D8A983, #BC7F57)",
    glow: "0 18px 34px rgba(188,127,87,0.34)",
  },
  {
    id: 2,
    name: "Stone",
    base: "linear-gradient(180deg, #C29380, #966659)",
    glow: "0 18px 34px rgba(150,102,89,0.34)",
  },
  {
    id: 3,
    name: "Moss",
    base: "linear-gradient(180deg, #B8B79B, #8D8A6A)",
    glow: "0 18px 34px rgba(141,138,106,0.32)",
  },
  {
    id: 4,
    name: "Pearl",
    base: "linear-gradient(180deg, #E3D4C7, #C5A793)",
    glow: "0 18px 34px rgba(197,167,147,0.32)",
  },
  {
    id: 5,
    name: "Cedar",
    base: "linear-gradient(180deg, #C59A72, #966341)",
    glow: "0 18px 34px rgba(150,99,65,0.34)",
  },
  {
    id: 6,
    name: "Mist",
    base: "linear-gradient(180deg, #D7D1C8, #B2A89C)",
    glow: "0 18px 34px rgba(178,168,156,0.3)",
  },
  {
    id: 7,
    name: "Clay",
    base: "linear-gradient(180deg, #D0A88F, #A6735D)",
    glow: "0 18px 34px rgba(166,115,93,0.34)",
  },
  {
    id: 8,
    name: "Olive",
    base: "linear-gradient(180deg, #B9B196, #878063)",
    glow: "0 18px 34px rgba(135,128,99,0.32)",
  },
];

function randomTileId() {
  return Math.floor(Math.random() * TILES.length);
}

export default function SequenceRecallPage() {
  const timeoutIdsRef = useRef([]);
  const [difficultyId, setDifficultyId] = useState("balanced");
  const [sequence, setSequence] = useState([]);
  const [status, setStatus] = useState("idle");
  const [activeTileId, setActiveTileId] = useState(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const difficulty =
    DIFFICULTIES.find((item) => item.id === difficultyId) ?? DIFFICULTIES[1];

  function clearPendingTimeouts() {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }

  function queueTimeout(callback, delay) {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((item) => item !== timeoutId);
      callback();
    }, delay);
    timeoutIdsRef.current = [...timeoutIdsRef.current, timeoutId];
  }

  function playSequence(nextSequence) {
    clearPendingTimeouts();
    setStatus("showing");
    setActiveTileId(null);
    setInputIndex(0);

    let elapsed = 280;

    nextSequence.forEach((tileId, index) => {
      queueTimeout(() => {
        setActiveTileId(tileId);
      }, elapsed);

      elapsed += difficulty.flashDuration;

      queueTimeout(() => {
        setActiveTileId(null);
        if (index === nextSequence.length - 1) {
          setStatus("input");
        }
      }, elapsed);

      elapsed += difficulty.pauseDuration;
    });
  }

  function startSession(nextDifficultyId = difficultyId) {
    const nextDifficulty =
      DIFFICULTIES.find((item) => item.id === nextDifficultyId) ?? DIFFICULTIES[1];

    clearPendingTimeouts();
    setDifficultyId(nextDifficulty.id);
    setMistakes(0);
    setBestRound(0);
    setRound(1);
    const nextSequence = [randomTileId(), randomTileId()];
    setSequence(nextSequence);
    setStatus("ready");
    setInputIndex(0);
    queueTimeout(() => playSequence(nextSequence), 240);
  }

  function handleTilePress(tileId) {
    if (status !== "input") return;

    const expectedTileId = sequence[inputIndex];
    if (tileId !== expectedTileId) {
      setStatus("miss");
      setMistakes((currentMistakes) => currentMistakes + 1);
      setActiveTileId(tileId);
      queueTimeout(() => {
        setActiveTileId(null);
        setStatus("gameover");
      }, 340);
      return;
    }

    setActiveTileId(tileId);
    queueTimeout(() => setActiveTileId(null), 240);

    if (inputIndex === sequence.length - 1) {
      const nextRound = round + 1;
      const nextSequence = [...sequence, randomTileId()];
      setBestRound((currentBest) => Math.max(currentBest, round));
      setRound(nextRound);
      setSequence(nextSequence);
      setStatus("success");
      setInputIndex(0);
      queueTimeout(() => playSequence(nextSequence), 800);
      return;
    }

    setInputIndex((currentIndex) => currentIndex + 1);
  }

  useEffect(() => () => {
    clearPendingTimeouts();
  }, []);

  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.22), transparent 28%), linear-gradient(180deg, #D4C6B8 0%, #C4B29F 48%, #B0947A 100%)",
      }}
    >
      <section className="mx-auto max-w-7xl px-5 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-8">
          <div
            className="overflow-hidden rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(50,50,50,0.08)] lg:p-7"
            style={{
              background:
                "linear-gradient(135deg, rgba(252,248,244,0.68), rgba(241,231,220,0.80))",
              borderColor: "rgba(50,50,50,0.10)",
            }}
          >
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "rgba(50,50,50,0.08)", color: DARK }}
                >
                  <Gauge className="h-4 w-4" />
                  Recall training mode
                </div>

                <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-[2.6rem]" style={{ color: DARK }}>
                  Sequence Recall, built to feel calm, focused, and native to Early ALsist.
                </h1>

                <p
                  className="mt-4 max-w-xl text-base leading-7 md:text-lg"
                  style={{ color: "rgba(50,50,50,0.82)" }}
                >
                  Watch the tile order, hold it briefly in memory, then repeat the pattern one cue at a time. The rhythm stays soft, but the challenge grows every round.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={() => startSession(difficultyId)}
                    className="shadow-md"
                    style={{ backgroundColor: DARK, color: "#FFFFFF" }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Start sequence
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    style={{
                      borderColor: DARK,
                      color: DARK,
                      backgroundColor: "transparent",
                    }}
                  >
                    <Link to="/memory-game">Back to Memory Match</Link>
                  </Button>
                </div>
              </div>

              <div
                className="rounded-[1.75rem] border p-5 shadow-[0_20px_55px_rgba(50,50,50,0.08)]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(50,50,50,0.96), rgba(50,50,50,0.88))",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: CREAM,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-white/60">Session</p>
                    <h2 className="mt-2 text-xl font-semibold md:text-2xl">Pattern memory challenge</h2>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/5 p-3">
                    <Brain className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Current round", value: `${round || 0}`, icon: Sparkles },
                    { label: "Best round", value: `${bestRound}`, icon: Trophy },
                    { label: "Sequence length", value: `${sequence.length || 0}`, icon: Gauge },
                    { label: "Mistakes", value: `${mistakes}`, icon: RefreshCw },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-sm text-white/65">
                        <span>{label}</span>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
            <aside className="space-y-4">
              <div
                className="rounded-[1.75rem] border p-5 shadow-[0_18px_48px_rgba(50,50,50,0.06)]"
                style={{
                  backgroundColor: "rgba(252,248,244,0.74)",
                  borderColor: "rgba(50,50,50,0.10)",
                }}
              >
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.56)" }}>
                  Pace
                </p>

                <div className="mt-3 space-y-2.5">
                  {DIFFICULTIES.map((option) => {
                    const active = option.id === difficultyId;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => startSession(option.id)}
                        className="w-full rounded-2xl border px-4 py-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                        style={{
                          backgroundColor: active ? DARK : "#FFFFFF",
                          color: active ? "#FFFFFF" : DARK,
                          borderColor: active ? DARK : "rgba(50,50,50,0.10)",
                          boxShadow: active
                            ? "0 18px 30px rgba(50,50,50,0.18)"
                            : "0 12px 24px rgba(50,50,50,0.05)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold">{option.label}</span>
                          <span className="text-sm opacity-75">{option.flashDuration}ms</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 opacity-80">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-[1.75rem] border p-5 shadow-[0_18px_48px_rgba(50,50,50,0.06)]"
                style={{
                  backgroundColor: "rgba(252,248,244,0.68)",
                  borderColor: "rgba(50,50,50,0.10)",
                }}
              >
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.56)" }}>
                  How to play
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6" style={{ color: "rgba(50,50,50,0.78)" }}>
                  <p>Watch the tiles flash in order.</p>
                  <p>Repeat the same order once the board unlocks.</p>
                  <p>Each successful round adds one more step to remember.</p>
                </div>
              </div>
            </aside>

            <section
              className="rounded-[2rem] border p-4 shadow-[0_22px_60px_rgba(50,50,50,0.08)] md:p-5"
              style={{
                backgroundColor: "rgba(250,244,238,0.76)",
                borderColor: "rgba(50,50,50,0.10)",
              }}
            >
              <div
                className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between"
                style={{ borderColor: "rgba(50,50,50,0.08)" }}
              >
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.56)" }}>
                    Board status
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold md:text-2xl" style={{ color: DARK }}>
                    {status === "idle" && "Start when you are ready"}
                    {status === "ready" && "Get ready to watch"}
                    {status === "showing" && "Watch the pattern"}
                    {status === "input" && "Repeat the sequence"}
                    {status === "success" && "Nice recall, next round coming up"}
                    {status === "miss" && "Almost there"}
                    {status === "gameover" && "Sequence broken"}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "rgba(50,50,50,0.08)", color: DARK }}
                  >
                    Mode: {difficulty.label}
                  </div>
                </div>
              </div>

              {status === "gameover" ? (
                <div
                  className="mt-5 rounded-[1.5rem] border p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(50,50,50,0.96), rgba(68,68,68,0.92))",
                    borderColor: "rgba(50,50,50,0.10)",
                    color: "#FFFFFF",
                  }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-white/60">Round over</p>
                      <h3 className="mt-2 text-2xl font-semibold">You reached round {round}.</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
                        The next attempt can start immediately, and the rhythm stays consistent with the calm visual feel of the rest of the app.
                      </p>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => startSession(difficultyId)}
                      style={{ backgroundColor: "#DDD0C8", color: DARK }}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex justify-center">
                <div
                  className="grid w-full grid-cols-3 gap-2.5 sm:gap-3"
                  style={{ width: "min(100%, 72vh, 700px)" }}
                >
                  {TILES.map((tile, index) => {
                    const isActive = activeTileId === tile.id;
                    const isPlayable = status === "input";

                    return (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => handleTilePress(tile.id)}
                        disabled={!isPlayable}
                        aria-label={`Sequence tile ${index + 1}`}
                        className="aspect-square rounded-[1.6rem] border p-3 transition-all duration-300 md:rounded-[1.8rem]"
                        style={{
                          background: isActive ? tile.base : TILE_IDLE_BG,
                          borderColor: isActive ? "rgba(50,50,50,0.28)" : "rgba(50,50,50,0.12)",
                          boxShadow: isActive
                            ? `${tile.glow}, inset 0 0 0 2px rgba(255,248,242,0.4)`
                            : "0 16px 30px rgba(50,50,50,0.08), inset 0 0 0 1px rgba(255,255,255,0.35)",
                          transform: isActive ? "scale(1.035)" : "scale(1)",
                          opacity: !isPlayable && status === "showing" ? 0.98 : 1,
                          cursor: isPlayable ? "pointer" : "default",
                        }}
                      >
                        <div className="flex h-full items-center justify-center">
                          <span
                            className="text-2xl font-semibold md:text-3xl"
                            style={{ color: isActive ? "#FFF8F2" : "rgba(50,50,50,0.72)" }}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
