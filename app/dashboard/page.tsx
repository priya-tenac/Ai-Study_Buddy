"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type StudySession = {
  id: string
  createdAt: string
  mode: "text" | "url" | "pdf"
  title: string
  summaryPreview: string
}

type StudyPlan = {
  id: string
  title: string
  date: string
  done: boolean
}

type QuizResult = {
  id: string
  createdAt: string
  mode: "solo" | "friend"
  difficulty: "easy" | "medium" | "hard"
  topic: string
  score: number
  totalQuestions: number
  durationSeconds: number
}

type UserStudyData = {
  sessions: StudySession[]
  plans: StudyPlan[]
}

const STORAGE_KEY_PREFIX = "ai-study-buddy:user:"
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

function loadUserData(email: string | null): UserStudyData {
  if (typeof window === "undefined" || !email) {
    return { sessions: [], plans: [] }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + email)
    if (!raw) return { sessions: [], plans: [] }
    const parsed = JSON.parse(raw)
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    }
  } catch {
    return { sessions: [], plans: [] }
  }
}

function saveUserData(email: string | null, data: UserStudyData) {
  if (typeof window === "undefined" || !email) return
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + email, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function loadQuizResults(email: string | null): QuizResult[] {
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

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [data, setData] = useState<UserStudyData>({ sessions: [], plans: [] })
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = window.localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    const decodedEmail = decodeEmailFromToken(token)
    setEmail(decodedEmail)
    setData(loadUserData(decodedEmail))
    setQuizResults(loadQuizResults(decodedEmail))
  }, [router])

  useEffect(() => {
    if (!email) return
    saveUserData(email, data)
  }, [email, data])

  const stats = useMemo(() => {
    const totalSessions = data.sessions.length
    const lastSession =
      data.sessions.length > 0
        ? new Date(data.sessions[data.sessions.length - 1].createdAt)
        : null
    const upcomingPlans = data.plans.filter((p) => !p.done).length
    const completedPlans = data.plans.filter((p) => p.done).length
    return { totalSessions, lastSession, upcomingPlans, completedPlans }
  }, [data])

  const analytics = useMemo(() => {
    const sessions = data.sessions
    const pdfSummaries = sessions.filter((s) => s.mode === "pdf").length

    let totalMcqs = 0
    let correctMcqs = 0
    const quizAccSeries: { label: string; accuracy: number }[] = []

    quizResults.forEach((r, idx) => {
      if (r.totalQuestions > 0) {
        totalMcqs += r.totalQuestions
        correctMcqs += r.score
      }
    })

    const lastResults = quizResults.slice(-5)
    lastResults.forEach((r, idx) => {
      if (r.totalQuestions > 0) {
        const acc = Math.round((r.score / r.totalQuestions) * 100)
        quizAccSeries.push({ label: `Q${quizResults.length - lastResults.length + idx + 1}`, accuracy: acc })
      }
    })

    const accuracyPercent = totalMcqs > 0 ? Math.round((correctMcqs / totalMcqs) * 100) : 0

    const dateSet = new Set<string>()
    sessions.forEach((s) => {
      const d = new Date(s.createdAt)
      if (!Number.isNaN(d.getTime())) {
        const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
        dateSet.add(iso)
      }
    })

    const sortedDates = Array.from(dateSet).sort()

    let bestStreak = 0
    let currentStreak = 0

    if (sortedDates.length > 0) {
      // best streak
      let streak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1])
        const curr = new Date(sortedDates[i])
        const diffDays =
          (new Date(curr.getFullYear(), curr.getMonth(), curr.getDate()).getTime() -
            new Date(prev.getFullYear(), prev.getMonth(), prev.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          streak += 1
        } else {
          bestStreak = Math.max(bestStreak, streak)
          streak = 1
        }
      }
      bestStreak = Math.max(bestStreak, streak)

      // current streak ending today or yesterday
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      let dayCursor = startOfToday
      while (true) {
        const iso = dayCursor.toISOString().slice(0, 10)
        if (dateSet.has(iso)) {
          currentStreak += 1
          dayCursor = new Date(dayCursor)
          dayCursor.setDate(dayCursor.getDate() - 1)
        } else {
          break
        }
      }
    }

    const today = new Date()
    const dailyActivity: { label: string; sessions: number; pdfs: number }[] = []
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const dayIso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      const daySessions = sessions.filter((s) => {
        const ds = new Date(s.createdAt)
        if (Number.isNaN(ds.getTime())) return false
        const iso = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate()).toISOString().slice(0, 10)
        return iso === dayIso
      })
      const totalForDay = daySessions.length
      const pdfForDay = daySessions.filter((s) => s.mode === "pdf").length
      dailyActivity.push({ label, sessions: totalForDay, pdfs: pdfForDay })
    }

    return {
      pdfSummaries,
      totalSummaries: sessions.length,
      totalMcqs,
      accuracyPercent,
      currentStreak,
      bestStreak,
      dailyActivity,
      quizAccSeries,
    }
  }, [data.sessions, quizResults])

  const recentSessions = [...data.sessions].slice(-4).reverse()

  return (
    <main
      className="min-h-screen px-4 py-8 md:py-12 flex justify-center"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="w-full max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              <span
                className="text-scramble"
                data-scramble-text={`Welcome back${email ? `, ${email}` : ""}`}
              >
                Welcome back{email ? `, ${email}` : ""}
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-md">
              Jump into smart notes, plan what to study next, and keep an eye on how your revision is adding up.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/summarize")}
              className="physics-button inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition"
            >
              Open Smart Notes
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/chat-pdf")}
              className="physics-button hidden md:inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 border border-slate-700 hover:border-indigo-500 hover:text-indigo-100 transition"
            >
              Chat with PDFs
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/quiz-battle")}
              className="physics-button hidden md:inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition"
            >
              AI Quiz Battle
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/exam-predictor")}
              className="physics-button hidden md:inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-xs font-medium text-amber-950 shadow-lg shadow-amber-500/40 hover:bg-amber-400 transition"
            >
              AI Exam Predictor
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-1 gap-4 md:gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
          }}
        >
          {/* Progress Tracker */}
          <motion.section
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
            className="scroll-reveal relative rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-sky-500/5 to-indigo-500/10 opacity-40 pointer-events-none" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <h2 className="text-sm md:text-base font-semibold">Progress Tracker</h2>
                </div>
              </div>
              <div className="space-y-3 text-xs md:text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Study sessions completed</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400"
                        style={{ width: `${Math.min(stats.totalSessions * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-300 min-w-[46px] text-right">
                      {stats.totalSessions}×
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Last study session</p>
                  <p className="text-[11px] text-slate-300">
                    {stats.lastSession
                      ? stats.lastSession.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "No sessions yet. Run your first summary!"}
                  </p>
                </div>
                <div className="pt-1 border-t border-slate-800 mt-1">
                  <p className="text-[11px] text-slate-400">
                    Every time you generate a summary, it will show up here and in your history.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>

        {/* History Dashboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="scroll-reveal rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <h2 className="text-sm md:text-base font-semibold">History Dashboard</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Showing your {recentSessions.length || "recent"} latest study sessions
            </p>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              No history yet. Once you generate summaries, they will appear here with time and source.
            </p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs md:text-sm">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                >
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-medium text-slate-100 truncate">{session.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {session.summaryPreview}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">
                      {session.mode === "text"
                        ? "Text"
                        : session.mode === "url"
                        ? "URL / YouTube"
                        : "PDF"}
                    </span>
                    <span>
                      {new Date(session.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Progress & Analytics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="scroll-reveal rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="text-sm md:text-base font-semibold">Progress & Analytics</h2>
            </div>
            <span className="text-[11px] text-slate-400">Last 7 days · Quiz history</span>
          </div>

          <div className="grid md:grid-cols-[1.4fr,1.2fr] gap-4 items-start">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 text-[10px] md:text-[11px]">
                <div className="rounded-xl subcard-soft px-3 py-2 flex flex-col min-w-[120px]">
                  <span className="text-slate-400 mb-0.5">PDFs summarized</span>
                  <span className="text-base md:text-lg font-semibold text-slate-50">
                    {analytics.pdfSummaries}
                  </span>
                </div>
                <div className="rounded-xl subcard-soft px-3 py-2 flex flex-col min-w-[120px]">
                  <span className="text-slate-400 mb-0.5">MCQs attempted</span>
                  <span className="text-base md:text-lg font-semibold text-slate-50">
                    {analytics.totalMcqs}
                  </span>
                </div>
                <div className="rounded-xl subcard-soft px-3 py-2 flex flex-col min-w-[120px]">
                  <span className="text-slate-400 mb-0.5">Accuracy</span>
                  <span className="text-base md:text-lg font-semibold text-emerald-300">
                    {analytics.accuracyPercent}%
                  </span>
                </div>
                <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 px-3 py-2 flex flex-col min-w-[120px]">
                  <span className="text-slate-200 mb-0.5 flex items-center gap-1">
                    Study streak <span>🔥</span>
                  </span>
                  <span className="text-base md:text-lg font-semibold text-amber-200">
                    {analytics.currentStreak} day{analytics.currentStreak === 1 ? "" : "s"}
                  </span>
                  <span className="text-[10px] text-amber-100/80">
                    Best: {analytics.bestStreak} day{analytics.bestStreak === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="mt-2 h-40 md:h-44 rounded-2xl subcard-soft px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-slate-300">Daily study activity</p>
                  <p className="text-[10px] text-slate-500">Sessions per day (PDF highlighted)</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyActivity} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={24} />
                    <Tooltip
                      cursor={{ fill: "#020617" }}
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #1f2937", borderRadius: 8, fontSize: 11 }}
                    />
                    <Bar dataKey="sessions" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pdfs" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-40 md:h-44 rounded-2xl subcard-soft px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-slate-300">Recent quiz accuracy</p>
                  <p className="text-[10px] text-slate-500">Last {analytics.quizAccSeries.length || 0} quizzes</p>
                </div>
                {analytics.quizAccSeries.length === 0 ? (
                  <p className="text-[11px] text-slate-500 mt-4">
                    No quiz data yet. Play an AI Quiz Battle to see your accuracy over time.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.quizAccSeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        width={24}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        cursor={{ fill: "#020617" }}
                        contentStyle={{ backgroundColor: "#020617", border: "1px solid #1f2937", borderRadius: 8, fontSize: 11 }}
                        formatter={(value: any) => [`${value}%`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
