import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, Sparkles, Timer, Trophy } from "lucide-react";

const BEIGE = "#DDD0C8";
const DARK = "#323232";
const CREAM = "#F7F1EC";

const DIFFICULTIES = [
  {
    id: "easy",
    label: "Gentle",
    pairs: 6,
    description: "A calm warm-up with fewer cards.",
    gridClass: "grid-cols-3 sm:grid-cols-4",
  },
  {
    id: "medium",
    label: "Balanced",
    pairs: 8,
    description: "A steady challenge for everyday focus.",
    gridClass: "grid-cols-4",
  },
  {
    id: "focus",
    label: "Focus",
    pairs: 10,
    description: "A fuller board for sharper recall.",
    gridClass: "grid-cols-4 sm:grid-cols-5",
  },
];

const MEMORY_TOPICS = [
  { key: "sleep", label: "Sleep", detail: "Keep a steady routine.", tint: "#F2E6DA" },
  { key: "reading", label: "Reading", detail: "Feed your mind new ideas.", tint: "#EADFD5" },
  { key: "hydration", label: "Hydration", detail: "Water supports daily clarity.", tint: "#EFE4DB" },
  { key: "walking", label: "Walking", detail: "Light movement boosts energy.", tint: "#E8DDD3" },
  { key: "music", label: "Music", detail: "Rhythm helps memory stick.", tint: "#F4E8DD" },
  { key: "nutrition", label: "Nutrition", detail: "Balanced meals support wellness.", tint: "#EDE0D5" },
  { key: "focus", label: "Focus", detail: "Small pauses can reset attention.", tint: "#F6EBE3" },
  { key: "calm", label: "Calm", detail: "Slow breaths help the brain settle.", tint: "#E9DED5" },
  { key: "social", label: "Connection", detail: "Conversations keep us engaged.", tint: "#F1E5DB" },
  { key: "stretch", label: "Stretch", detail: "Gentle motion keeps you loose.", tint: "#EEE1D8" },
];

function shuffleDeck(pairCount) {
  const cards = MEMORY_TOPICS.slice(0, pairCount).flatMap((item) => [
    { ...item, id: `${item.key}-a`, pairId: item.key },
    { ...item, id: `${item.key}-b`, pairId: item.key },
  ]);

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
  }

  return cards;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export default function MemoryGamePage() {
  const timeoutIdsRef = useRef([]);
  const [difficultyId, setDifficultyId] = useState("medium");
  const [cards, setCards] = useState(() => shuffleDeck(8));
  const [selectedIds, setSelectedIds] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [previewing, setPreviewing] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const difficulty =
    DIFFICULTIES.find((item) => item.id === difficultyId) ?? DIFFICULTIES[1];
  const hasWon = matchedPairs.length === difficulty.pairs;
  const accuracy = moves > 0 ? Math.round((matchedPairs.length / moves) * 100) : 0;

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

  function startNewGame(nextDifficultyId = difficultyId) {
    const nextDifficulty =
      DIFFICULTIES.find((item) => item.id === nextDifficultyId) ?? DIFFICULTIES[1];

    clearPendingTimeouts();
    setDifficultyId(nextDifficulty.id);
    setCards(shuffleDeck(nextDifficulty.pairs));
    setSelectedIds([]);
    setMatchedPairs([]);
    setMoves(0);
    setSeconds(0);
    setPreviewing(true);
    setHasStarted(false);
    setIsLocked(true);
    setStreak(0);
    setBestStreak(0);
  }

  function handleCardClick(card) {
    const isFaceUp =
      previewing || selectedIds.includes(card.id) || matchedPairs.includes(card.pairId);

    if (isFaceUp || isLocked || hasWon) {
      return;
    }

    if (!hasStarted) {
      setHasStarted(true);
    }

    const nextSelectedIds = [...selectedIds, card.id];
    setSelectedIds(nextSelectedIds);

    if (nextSelectedIds.length < 2) {
      return;
    }

    const firstCard = cards.find((item) => item.id === nextSelectedIds[0]);
    setIsLocked(true);
    setMoves((currentMoves) => currentMoves + 1);

    if (firstCard?.pairId === card.pairId) {
      queueTimeout(() => {
        setMatchedPairs((currentMatches) => [...currentMatches, card.pairId]);
        setSelectedIds([]);
        setIsLocked(false);
        setStreak((currentStreak) => {
          const nextStreak = currentStreak + 1;
          setBestStreak((currentBest) => Math.max(currentBest, nextStreak));
          return nextStreak;
        });
      }, 420);
      return;
    }

    queueTimeout(() => {
      setSelectedIds([]);
      setIsLocked(false);
      setStreak(0);
    }, 760);
  }

  useEffect(() => {
    const previewTimeout = window.setTimeout(() => {
      setPreviewing(false);
      setIsLocked(false);
    }, 1400);

    return () => window.clearTimeout(previewTimeout);
  }, [cards]);

  useEffect(() => {
    if (!hasStarted || previewing || hasWon) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasStarted, previewing, hasWon]);

  useEffect(() => () => {
    clearPendingTimeouts();
  }, []);

  return (
    <main
      className="min-h-screen pb-0"
      style={{
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.22), transparent 28%), linear-gradient(180deg, #CFC0B3 0%, #C8B6A6 48%, #B69D89 100%)",
      }}
    >
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div
            className="overflow-hidden rounded-[2rem] border p-8 shadow-[0_28px_80px_rgba(50,50,50,0.08)] lg:p-10"
            style={{
              background:
                "linear-gradient(135deg, rgba(252,248,244,0.68), rgba(241,231,220,0.80))",
              borderColor: "rgba(50,50,50,0.10)",
            }}
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "rgba(50,50,50,0.08)", color: DARK }}
                >
                  <Sparkles className="h-4 w-4" />
                  Cognitive exercise mode
                </div>

                <h1
                  className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl"
                  style={{ color: DARK }}
                >
                  Memory Match, designed to feel like part of Early ALsist.
                </h1>

                <p
                  className="mt-5 max-w-xl text-lg leading-8"
                  style={{ color: "rgba(50,50,50,0.82)" }}
                >
                  This lightweight card-matching game gives visitors a calm,
                  polished way to engage with the app beyond detection. It is
                  meant as a supportive focus activity, not a diagnostic tool.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    onClick={() => startNewGame(difficultyId)}
                    className="shadow-md"
                    style={{ backgroundColor: DARK, color: "#FFFFFF" }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    New round
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
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              </div>

              <div
                className="rounded-[1.75rem] border p-6 shadow-[0_20px_55px_rgba(50,50,50,0.08)]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(50,50,50,0.96), rgba(50,50,50,0.88))",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: CREAM,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-white/60">
                      Session
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Calm recall challenge
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/5 p-3">
                    <Brain className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Time", value: formatTime(seconds), icon: Timer },
                    { label: "Best streak", value: `${bestStreak}`, icon: Trophy },
                    { label: "Moves", value: `${moves}`, icon: RefreshCw },
                    { label: "Accuracy", value: `${accuracy}%`, icon: Sparkles },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between text-sm text-white/65">
                        <span>{label}</span>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <div
                className="rounded-[1.75rem] border p-6 shadow-[0_18px_48px_rgba(50,50,50,0.06)]"
                style={{
                  backgroundColor: "rgba(252,248,244,0.74)",
                  borderColor: "rgba(50,50,50,0.10)",
                }}
              >
                <p
                  className="text-sm uppercase tracking-[0.24em]"
                  style={{ color: "rgba(50,50,50,0.56)" }}
                >
                  Difficulty
                </p>

                <div className="mt-4 space-y-3">
                  {DIFFICULTIES.map((option) => {
                    const active = option.id === difficultyId;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => startNewGame(option.id)}
                        className="w-full rounded-2xl border px-4 py-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
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
                          <span className="text-base font-semibold">
                            {option.label}
                          </span>
                          <span className="text-sm opacity-75">
                            {option.pairs * 2} cards
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 opacity-80">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-[1.75rem] border p-6 shadow-[0_18px_48px_rgba(50,50,50,0.06)]"
                style={{
                  backgroundColor: "rgba(252,248,244,0.68)",
                  borderColor: "rgba(50,50,50,0.10)",
                }}
              >
                <p
                  className="text-sm uppercase tracking-[0.24em]"
                  style={{ color: "rgba(50,50,50,0.56)" }}
                >
                  How it works
                </p>
                <div
                  className="mt-4 space-y-3 text-sm leading-7"
                  style={{ color: "rgba(50,50,50,0.78)" }}
                >
                  <p>
                    The board opens with a short preview so players can scan
                    card positions before play begins.
                  </p>
                  <p>
                    Match two cards with the same wellbeing label to build
                    streaks and improve accuracy.
                  </p>
                </div>
              </div>
            </aside>

            <section
              className="rounded-[2rem] border p-5 shadow-[0_22px_60px_rgba(50,50,50,0.08)] md:p-6"
              style={{
                backgroundColor: "rgba(250,244,238,0.76)",
                borderColor: "rgba(50,50,50,0.10)",
              }}
            >
              <div
                className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between"
                style={{ borderColor: "rgba(50,50,50,0.08)" }}
              >
                <div>
                  <p
                    className="text-sm uppercase tracking-[0.24em]"
                    style={{ color: "rgba(50,50,50,0.56)" }}
                  >
                    Board status
                  </p>
                  <h2
                    className="mt-2 text-2xl font-semibold"
                    style={{ color: DARK }}
                  >
                    {hasWon
                      ? "Round complete"
                      : previewing
                        ? "Preview the cards"
                        : "Find every matching pair"}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: hasWon
                        ? "rgba(50,50,50,0.12)"
                        : previewing
                          ? "rgba(255,255,255,0.92)"
                          : "rgba(50,50,50,0.08)",
                      color: DARK,
                    }}
                  >
                    {matchedPairs.length} of {difficulty.pairs} pairs found
                  </div>

                  <div
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "rgba(50,50,50,0.08)", color: DARK }}
                  >
                    Current streak: {streak}
                  </div>
                </div>
              </div>

              {hasWon ? (
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
                      <p className="text-sm uppercase tracking-[0.24em] text-white/60">
                        Nice finish
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">
                        You cleared the board in {formatTime(seconds)}.
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
                        Smooth pacing, soft contrast, and simple feedback keep
                        the experience aligned with the rest of the app while
                        still making the game feel rewarding.
                      </p>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => startNewGame(difficultyId)}
                      style={{ backgroundColor: BEIGE, color: DARK }}
                    >
                      Play again
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className={`mt-6 grid gap-3 ${difficulty.gridClass}`}>
                {cards.map((card) => {
                  const isMatched = matchedPairs.includes(card.pairId);
                  const isSelected = selectedIds.includes(card.id);
                  const isFaceUp = previewing || isMatched || isSelected;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleCardClick(card)}
                      className="group relative aspect-[4/5] w-full rounded-[1.4rem] text-left transition-transform duration-300 hover:-translate-y-1 disabled:cursor-not-allowed"
                      disabled={previewing || isLocked || isMatched}
                      style={{ perspective: "1200px" }}
                    >
                      <div
                        className="relative h-full w-full rounded-[1.4rem] duration-500"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: isFaceUp ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        <div
                          className="absolute inset-0 flex h-full flex-col justify-between rounded-[1.4rem] border p-4"
                          style={{
                            backfaceVisibility: "hidden",
                            background:
                              "linear-gradient(180deg, rgba(50,50,50,0.98), rgba(77,77,77,0.94))",
                            borderColor: "rgba(255,255,255,0.08)",
                            color: "#FFFFFF",
                            boxShadow: "0 20px 30px rgba(50,50,50,0.12)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/70">
                              Match
                            </span>
                            <div className="flex gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
                              <span className="h-2.5 w-2.5 rounded-full bg-white/55" />
                              <span className="h-2.5 w-2.5 rounded-full bg-white/75" />
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-white/65">Early ALsist</p>
                            <h3 className="mt-2 text-2xl font-semibold">Memory</h3>
                          </div>
                        </div>

                        <div
                          className="absolute inset-0 flex h-full flex-col justify-between rounded-[1.4rem] border p-4"
                          style={{
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden",
                            background: `linear-gradient(180deg, ${card.tint}, #FFFFFF)`,
                            borderColor: isMatched ? DARK : "rgba(50,50,50,0.10)",
                            boxShadow: isMatched
                              ? "0 22px 34px rgba(50,50,50,0.16)"
                              : "0 14px 26px rgba(50,50,50,0.08)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.24em]"
                              style={{
                                backgroundColor: isMatched
                                  ? DARK
                                  : "rgba(50,50,50,0.08)",
                                color: isMatched ? "#FFFFFF" : DARK,
                              }}
                            >
                              {isMatched ? "Matched" : "Wellbeing"}
                            </span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: "rgba(50,50,50,0.62)" }}
                            >
                              {card.label.length} letters
                            </span>
                          </div>

                          <div>
                            <h3
                              className="text-2xl font-semibold"
                              style={{ color: DARK }}
                            >
                              {card.label}
                            </h3>
                            <p
                              className="mt-2 text-sm leading-6"
                              style={{ color: "rgba(50,50,50,0.74)" }}
                            >
                              {card.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
