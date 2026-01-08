"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

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

type UserStudyData = {
  sessions: StudySession[]
  plans: StudyPlan[]
}

const STORAGE_KEY_PREFIX = "ai-study-buddy:user:"

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

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [data, setData] = useState<UserStudyData>({ sessions: [], plans: [] })
  const [newPlanTitle, setNewPlanTitle] = useState("")
  const [newPlanDate, setNewPlanDate] = useState("")

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

  const addPlan = () => {
    if (!newPlanTitle.trim()) return
    const plan: StudyPlan = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newPlanTitle.trim(),
      date: newPlanDate || new Date().toISOString().slice(0, 10),
      done: false,
    }
    setData((prev) => ({ ...prev, plans: [...prev.plans, plan] }))
    setNewPlanTitle("")
    setNewPlanDate("")
  }

  const togglePlan = (id: string) => {
    setData((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    }))
  }

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
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/summarize")}
            className="physics-button inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition"
          >
            Open Smart Notes
          </motion.button>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-[2fr,1.4fr] gap-4 md:gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
          }}
        >
          {/* Study Planner */}
          <motion.section
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
            className="scroll-reveal relative rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-emerald-500/10 opacity-40 pointer-events-none" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗓️</span>
                  <h2 className="text-sm md:text-base font-semibold">Study Planner</h2>
                </div>
                <p className="text-[11px] text-slate-400">
                  {stats.upcomingPlans} upcoming · {stats.completedPlans} done
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 text-xs md:text-sm">
                <input
                  type="text"
                  placeholder="Topic or chapter (e.g. Limits & Continuity)"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
                <input
                  type="date"
                  value={newPlanDate}
                  onChange={(e) => setNewPlanDate(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="button"
                  onClick={addPlan}
                  className="physics-button rounded-xl bg-indigo-500 px-3 py-2 text-xs md:text-sm font-medium text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-400 transition"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 max-h-52 overflow-y-auto space-y-2 pr-1">
                {data.plans.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    No plans yet. Add a topic you want to revise this week.
                  </p>
                )}
                {data.plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => togglePlan(plan.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 text-xs md:text-sm transition flex items-center justify-between gap-2
                      ${plan.done
                        ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100"
                        : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-600"}`}
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium truncate">{plan.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {plan.done ? "Completed" : "Planned for"} {plan.date}
                      </p>
                    </div>
                    <span className="text-lg">{plan.done ? "✅" : "⏳"}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

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
          className="scroll-reveal rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 shadow-xl"
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
      </div>
    </main>
  )
}
