"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Difficulty = "easy" | "medium" | "hard"
type Mode = "solo" | "friend"
type Mood = "sleepy" | "neutral" | "energized"

type QuizQuestion = {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

type QuizResult = {
  id: string
  createdAt: string
  mode: Mode
  difficulty: Difficulty
  topic: string
  score: number
  totalQuestions: number
  durationSeconds: number
}

const QUIZ_STORAGE_KEY_PREFIX = "ai-study-buddy:quiz:"

function decodeEmailFromToken(token: string | null): string | null {
  if (!token) return null
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    const data = JSON.parse(json)
    if (typeof data.email === "string") return data.email
    return null
  } catch {
    return null
  }
}

function loadResults(email: string | null): QuizResult[] {
  if (typeof window === "undefined" || !email) return []
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY_PREFIX + email)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QuizResult[]) : []
  } catch {
    return []
  }
}

function saveResults(email: string | null, results: QuizResult[]) {
  if (typeof window === "undefined" || !email) return
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY_PREFIX + email, JSON.stringify(results.slice(-100)))
  } catch {
    // ignore
  }
}

export default function QuizBattlePage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  const [mode, setMode] = useState<Mode>("solo")
  const [mood, setMood] = useState<Mood>("neutral")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [topic, setTopic] = useState("")
  const [numQuestions, setNumQuestions] = useState(5)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [playerTwoScore, setPlayerTwoScore] = useState(0)
  const [playerOneDuration, setPlayerOneDuration] = useState<number | null>(null)
  const [playerTwoDuration, setPlayerTwoDuration] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const [results, setResults] = useState<QuizResult[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = window.localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    const decoded = decodeEmailFromToken(token)
    setEmail(decoded)
    setResults(loadResults(decoded))
  }, [router])

  useEffect(() => {
    if (!email) return
    saveResults(email, results)
  }, [email, results])

  useEffect(() => {
    if (!started || finished) return
    if (remainingSeconds <= 0) {
      if (mode === "friend") {
        // In Friend vs Friend mode, timing out ends the current player's round.
        handleEndOfPlayerRound()
      } else {
        handleFinish()
      }
      return
    }
    const id = window.setTimeout(() => setRemainingSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [started, finished, remainingSeconds, mode])

  // currentPlayer is managed as state so that in Friend vs Friend mode
  // both players can answer each question in turn.

  const leaderboard = useMemo(() => {
    const sorted = [...results].sort((a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds)
    return sorted.slice(0, 10)
  }, [results])

  const quizDurationSeconds = useMemo(() => {
    return numQuestions * 30
  }, [numQuestions])

  const handleStart = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic or syllabus description.")
      return
    }
    setError(null)

    const startingSecondPlayer = mode === "friend" && playerOneDuration !== null && !finished && currentPlayer === 2

    setLoading(true)
    setStarted(false)
    setFinished(false)
    setQuestions([])
    setCurrentIndex(0)
    setSelectedOption(null)
    setShowExplanation(false)

    if (startingSecondPlayer) {
      // Starting Player 2's round: keep Player 1's score and time, reset Player 2.
      setPlayerTwoScore(0)
      setCurrentPlayer(2)
    } else {
      // Fresh game (solo or new friend battle).
      setCurrentPlayer(1)
      setScore(0)
      setPlayerTwoScore(0)
      setPlayerOneDuration(null)
      setPlayerTwoDuration(null)
    }

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null
      if (!token) {
        setError("Please log in to play the quiz.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, difficulty, numQuestions, mood }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not generate quiz questions.")
        setLoading(false)
        return
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        setError("No quiz questions were generated.")
        setLoading(false)
        return
      }

      setQuestions(data.questions as QuizQuestion[])
      setStarted(true)
      setFinished(false)
      setRemainingSeconds(quizDurationSeconds)
    } catch (e) {
      setError("Something went wrong while starting the quiz.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (index: number) => {
    if (!started || finished || selectedOption !== null) return
    setSelectedOption(index)
    setShowExplanation(true)

    const question = questions[currentIndex]
    const chosen = question.options[index]
    const isCorrect = chosen === question.answer

    if (mode === "solo") {
      if (isCorrect) setScore((s) => s + 1)
    } else {
      if (currentPlayer === 1) {
        if (isCorrect) setScore((s) => s + 1)
      } else {
        if (isCorrect) setPlayerTwoScore((s) => s + 1)
      }
    }
  }

  const handleEndOfPlayerRound = () => {
    if (questions.length === 0 || !started) return

    const durationUsed = quizDurationSeconds - remainingSeconds
    const safeDuration = Math.max(durationUsed, 0)

    if (mode !== "friend") {
      handleFinish()
      return
    }

    if (currentPlayer === 1) {
      setPlayerOneDuration(safeDuration)
      setStarted(false)
      setSelectedOption(null)
      setShowExplanation(false)
      setCurrentIndex(0)
      setRemainingSeconds(quizDurationSeconds)
      setCurrentPlayer(2)
    } else {
      setPlayerTwoDuration(safeDuration)
      setStarted(false)
      setSelectedOption(null)
      setShowExplanation(false)
      handleFinish()
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      if (mode === "friend") {
        // End current player's round; next player (or final result) will be handled there.
        handleEndOfPlayerRound()
      } else {
        handleFinish()
      }
      return
    }

    // Move to next question (solo or friend current player)
    setCurrentIndex((i) => i + 1)
    setSelectedOption(null)
    setShowExplanation(false)
  }

  const handleFinish = () => {
    if (finished || questions.length === 0) return
    setFinished(true)
    setStarted(false)

    const total = questions.length

    if (mode === "solo") {
      const durationUsed = quizDurationSeconds - remainingSeconds
      const result: QuizResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        mode,
        difficulty,
        topic: topic.trim().slice(0, 120),
        score,
        totalQuestions: total,
        durationSeconds: Math.max(durationUsed, 0),
      }
      setResults((prev) => [...prev, result])
      return
    }

    // Friend vs Friend: decide winner based on accuracy and time.
    const p1Score = score
    const p2Score = playerTwoScore
    const p1Duration = playerOneDuration ?? quizDurationSeconds
    const p2Duration = playerTwoDuration ?? quizDurationSeconds

    const p1Accuracy = total > 0 ? p1Score / total : 0
    const p2Accuracy = total > 0 ? p2Score / total : 0

    let winner: "Player 1" | "Player 2" | "Tie" = "Tie"
    if (p1Accuracy > p2Accuracy) {
      winner = "Player 1"
    } else if (p2Accuracy > p1Accuracy) {
      winner = "Player 2"
    } else if (p1Duration < p2Duration) {
      winner = "Player 1"
    } else if (p2Duration < p1Duration) {
      winner = "Player 2"
    }

    const winnerScore = winner === "Player 2" ? p2Score : p1Score
    const winnerDuration = winner === "Player 2" ? p2Duration : p1Duration

    const result: QuizResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      mode,
      difficulty,
      topic: topic.trim().slice(0, 120),
      score: winnerScore,
      totalQuestions: total,
      durationSeconds: Math.max(winnerDuration, 0),
    }
    setResults((prev) => [...prev, result])
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const currentQuestion = questions[currentIndex]

  const startingSecondPlayer =
    mode === "friend" && playerOneDuration !== null && !finished && currentPlayer === 2

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-8 md:py-12"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="w-full max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="physics-button inline-flex items-center gap-2 rounded-full border border-indigo-500/70 bg-indigo-500 px-3.5 py-1.5 text-xs font-medium text-slate-50 shadow-md shadow-indigo-500/30 transition-transform duration-150 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/40 active:translate-y-[1px] mb-1"
        >
          <span className="text-sm">←</span>
          <span>Back to dashboard</span>
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              AI Quiz Battle
            </span>
          </h1>
          <p className="text-sm md:text-base text-soft max-w-2xl">
            Play a solo timed quiz or challenge a friend on the same syllabus. Questions are generated by your AI study buddy.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-slate-400">
            <span className="uppercase tracking-[0.18em] text-slate-500">Mood</span>
            <div className="inline-flex rounded-full bg-slate-900/70 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMood("sleepy")
                  setDifficulty("easy")
                }}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                  mood === "sleepy"
                    ? "bg-indigo-500 text-slate-50 shadow-sm shadow-indigo-500/40"
                    : "text-slate-300 hover:text-slate-50"
                }`}
              >
                <span>😴</span>
                <span className="hidden sm:inline">Chill / easier</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMood("neutral")
                  setDifficulty("medium")
                }}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                  mood === "neutral"
                    ? "bg-indigo-500 text-slate-50 shadow-sm shadow-indigo-500/40"
                    : "text-slate-300 hover:text-slate-50"
                }`}
              >
                <span>😐</span>
                <span className="hidden sm:inline">Standard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMood("energized")
                  setDifficulty("hard")
                }}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                  mood === "energized"
                    ? "bg-indigo-500 text-slate-50 shadow-sm shadow-indigo-500/40"
                    : "text-slate-300 hover:text-slate-50"
                }`}
              >
                <span>😄</span>
                <span className="hidden sm:inline">Bring it on</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-500">
              AI tunes difficulty and feedback to how you feel.
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.5fr,1.1fr] gap-6 items-start">
          {/* Left: quiz configuration & play area */}
          <div className="scroll-reveal card-soft rounded-2xl p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Mode</span>
                <div className="inline-flex rounded-full bg-slate-100/80 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("solo")
                      setPlayerTwoScore(0)
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-medium transition ${
                      mode === "solo"
                        ? "bg-indigo-500 text-slate-50 shadow-sm shadow-indigo-500/40"
                        : "text-slate-300 hover:text-slate-50"
                    }`}
                  >
                    Solo (timed)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("friend")
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-medium transition ${
                      mode === "friend"
                        ? "bg-indigo-500 text-slate-50 shadow-sm shadow-indigo-500/40"
                        : "text-slate-300 hover:text-slate-50"
                    }`}
                  >
                    Friend vs Friend
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Difficulty</span>
                <div className="inline-flex rounded-full bg-slate-100/80 p-1 border border-slate-200">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`px-2.5 py-1 rounded-full text-[11px] md:text-xs font-medium transition ${
                        difficulty === level
                          ? "bg-emerald-500 text-slate-50 shadow-sm shadow-emerald-500/40"
                          : "text-slate-300 hover:text-slate-50"
                      }`}
                    >
                      {level === "easy" ? "Easy" : level === "medium" ? "Medium" : "Hard"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Questions</span>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value) || 5)}
                  className="rounded-full border border-slate-300 bg-white/90 px-2.5 py-1 text-[11px] md:text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                </select>
              </div>

              {started && !finished && (
                <div className="ml-auto flex items-center gap-2 text-[11px] md:text-xs text-slate-300">
                  <span>Time left</span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-mono text-xs text-emerald-700">
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-3">
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Topic / syllabus
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input-soft text-xs md:text-sm"
                placeholder="e.g. Control systems: time response, Bode plots, stability criteria"
              />
              <p className="text-[11px] text-slate-500">
                Use the same description when playing Friend vs Friend so you both battle on the same syllabus.
              </p>
            </div>

            {error && (
              <div className="mt-2 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
                {error}
              </div>
            )}

            {!started && !finished && (
              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="physics-button mt-3 inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 disabled:bg-slate-700 disabled:shadow-none disabled:cursor-not-allowed transition"
              >
                {loading
                  ? "Preparing questions..."
                  : mode === "solo"
                  ? "Start solo quiz"
                  : startingSecondPlayer
                  ? "Start Player 2's turn"
                  : "Start friend battle"}
              </button>
            )}

            {started && currentQuestion && (
              <div className="mt-4 rounded-2xl subcard-soft p-3 md:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-[11px] md:text-xs text-slate-400">
                  <span>
                    Question {currentIndex + 1} / {questions.length}
                  </span>
                  {mode === "friend" && (
                    <span
                      className={`font-medium ${
                        currentPlayer === 1 ? "text-sky-300" : "text-pink-300"
                      }`}
                    >
                      Player {currentPlayer}&apos;s turn
                    </span>
                  )}
                </div>
                <p
                  className="text-sm md:text-base font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {currentQuestion.question}
                </p>
                <div className="mt-2 space-y-2">
                  {currentQuestion.options.map((opt, idx) => {
                    const chosen = selectedOption === idx
                    const isCorrect = opt === currentQuestion.answer
                    let baseClasses =
                      "w-full text-left rounded-xl border px-3 py-2 text-xs md:text-sm transition-all duration-150"
                    let stateClasses = " hover:border-slate-500"

                    if (selectedOption != null) {
                      if (chosen && isCorrect) {
                        stateClasses =
                          " border-emerald-500 bg-emerald-500/10 text-emerald-900 ring-2 ring-emerald-400/70 scale-[1.01] shadow-[0_14px_40px_rgba(16,185,129,0.35)]"
                      } else if (chosen && !isCorrect) {
                        stateClasses =
                          " border-red-500 bg-red-500/10 text-red-900 ring-2 ring-red-400/70 scale-[1.01] shadow-[0_14px_40px_rgba(248,113,113,0.3)]"
                      } else if (isCorrect) {
                        stateClasses =
                          " border-emerald-500/80 bg-emerald-500/5 text-emerald-900 ring-1 ring-emerald-400/60"
                      }
                    }

                    // Use the gradient mcq-option-soft base only for neutral options
                    if (selectedOption == null || (!isCorrect && !chosen)) {
                      baseClasses += " mcq-option-soft"
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        className={baseClasses + stateClasses}
                        disabled={selectedOption != null}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {showExplanation && currentQuestion.explanation && (
                  <div className="mt-2 rounded-xl subcard-soft px-3 py-2 text-[11px] text-soft">
                    <span className="font-semibold text-emerald-600">Why: </span>
                    {currentQuestion.explanation}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] md:text-xs text-slate-400">
                  <div>
                    {mode === "solo" ? (
                      <span>
                        Score: {score} / {questions.length}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            currentPlayer === 1
                              ? "bg-sky-500/20 border-sky-400 text-sky-100"
                              : "border-slate-600 text-slate-200"
                          }`}
                        >
                          P1: {score}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            currentPlayer === 2
                              ? "bg-pink-500/20 border-pink-400 text-pink-100"
                              : "border-slate-600 text-slate-200"
                          }`}
                        >
                          P2: {playerTwoScore}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="physics-button rounded-full bg-indigo-500 px-3 py-1.5 text-[11px] text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-400"
                  >
                    {currentIndex + 1 >= questions.length ? "Finish" : "Next question"}
                  </button>
                </div>
              </div>
            )}

            {finished && (
              <div className="mt-4 rounded-2xl subcard-soft p-3 md:p-4 space-y-2 text-xs md:text-sm text-soft">
                <p className="font-semibold text-base">
                  {mode === "solo"
                    ? `You scored ${score} / ${questions.length}.`
                    : (() => {
                        const total = questions.length || numQuestions
                        const p1Score = score
                        const p2Score = playerTwoScore
                        const p1Duration = playerOneDuration ?? quizDurationSeconds
                        const p2Duration = playerTwoDuration ?? quizDurationSeconds
                        const p1Accuracy = total > 0 ? Math.round((p1Score / total) * 100) : 0
                        const p2Accuracy = total > 0 ? Math.round((p2Score / total) * 100) : 0

                        let winner: "Player 1" | "Player 2" | "Tie" = "Tie"
                        if (p1Accuracy > p2Accuracy) {
                          winner = "Player 1"
                        } else if (p2Accuracy > p1Accuracy) {
                          winner = "Player 2"
                        } else if (p1Duration < p2Duration) {
                          winner = "Player 1"
                        } else if (p2Duration < p1Duration) {
                          winner = "Player 2"
                        }

                        return `Player 1: ${p1Score}/${total} (${p1Accuracy}%, ${formatTime(
                          p1Duration,
                        )}) · Player 2: ${p2Score}/${total} (${p2Accuracy}%, ${formatTime(
                          p2Duration,
                        )}). Winner: ${winner}.`
                      })()}
                </p>
                <p className="text-soft">
                  Mode: {mode === "solo" ? "Solo timed quiz" : "Friend vs Friend"} · Difficulty: {difficulty}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFinished(false)
                    setStarted(false)
                    setQuestions([])
                    setCurrentIndex(0)
                    setCurrentPlayer(1)
                    setSelectedOption(null)
                    setShowExplanation(false)
                    setScore(0)
                    setPlayerTwoScore(0)
                    setPlayerOneDuration(null)
                    setPlayerTwoDuration(null)
                  }}
                  className="physics-button mt-2 inline-flex items-center justify-center rounded-full bg-indigo-500 px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-400"
                >
                  Play again
                </button>
              </div>
            )}
          </div>

          {/* Right: leaderboard */}
          <div className="scroll-reveal card-soft rounded-2xl p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] space-y-3 min-h-[220px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h2 className="text-sm md:text-base font-semibold">Leaderboard</h2>
              </div>
              <span className="text-[11px] text-slate-400">Local to your account</span>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No quiz results yet. Play a quiz to start filling your leaderboard.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-[11px] md:text-xs">
                {leaderboard.map((r, idx) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-xl subcard-soft px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-5 text-slate-400">#{idx + 1}</span>
                      <div>
                        <p className="text-slate-100 font-medium">
                          {r.score} / {r.totalQuestions} · {r.difficulty}
                        </p>
                        <p className="text-slate-400 truncate max-w-[180px]">
                          {r.mode === "solo" ? "Solo" : "Friend vs Friend"} · {r.topic}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-slate-400">
                      <p className="font-mono text-[10px]">{formatTime(r.durationSeconds)}</p>
                      <p className="text-[10px]">
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
