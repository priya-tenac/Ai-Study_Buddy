"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

type StudyPlan = {
  id: string
  title: string
  date: string
  done: boolean
}

type StudySession = {
  id: string
  createdAt: string
  mode: "text" | "url" | "pdf"
  title: string
  summaryPreview: string
}

type AIStudySubject = {
  name: string
  topics?: string
  hours?: number
}

type AIStudyDay = {
  date?: string
  label?: string
  subjects?: AIStudySubject[]
}

type AIStudyWeek = {
  weekLabel?: string
  startDate?: string
  endDate?: string
  focus?: string
  days?: AIStudyDay[]
}

type AIStudyPlan = {
  overview?: string
  weeks?: AIStudyWeek[]
  tips?: string[]
}

type UserStudyData = {
  sessions: StudySession[]
  plans: StudyPlan[]
}

const STORAGE_KEY_PREFIX = "ai-study-buddy:user:"
const PLAN_STORAGE_KEY_PREFIX = "ai-study-buddy:plan:"

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
      sessions: Array.isArray(parsed.sessions) ? (parsed.sessions as StudySession[]) : [],
      plans: Array.isArray(parsed.plans) ? (parsed.plans as StudyPlan[]) : [],
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

export default function StudyPlannerPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [data, setData] = useState<UserStudyData>({ sessions: [], plans: [] })
  const [newPlanTitle, setNewPlanTitle] = useState("")
  const [newPlanDate, setNewPlanDate] = useState("")

  const [aiExamDate, setAiExamDate] = useState("")
  const [aiSubjects, setAiSubjects] = useState("")
  const [aiDailyHours, setAiDailyHours] = useState("3")
  const [aiPlan, setAiPlan] = useState<AIStudyPlan | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [examType, setExamType] = useState("semester")
  const [subjectPriorityNotes, setSubjectPriorityNotes] = useState("")
  const [weakTopics, setWeakTopics] = useState("")
  const [studyStyles, setStudyStyles] = useState<string[]>([])
  const [productivityLevel, setProductivityLevel] = useState<"chill" | "balanced" | "aggressive">("balanced")
  const [breakPattern, setBreakPattern] = useState("25-5")
  const [weeklyRestDay, setWeeklyRestDay] = useState(true)
  const [revisionPrefs, setRevisionPrefs] = useState<string[]>([])
  const [timeSplitEnabled, setTimeSplitEnabled] = useState(false)
  const [timeMorning, setTimeMorning] = useState("0")
  const [timeAfternoon, setTimeAfternoon] = useState("0")
  const [timeNight, setTimeNight] = useState("0")
  const [adaptivePlan, setAdaptivePlan] = useState(false)
  const [motivationLevel, setMotivationLevel] = useState("normal")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [timeSplitError, setTimeSplitError] = useState<string | null>(null)

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

    if (decodedEmail) {
      try {
        const rawPlan = window.localStorage.getItem(PLAN_STORAGE_KEY_PREFIX + decodedEmail)
        if (rawPlan) {
          const parsed = JSON.parse(rawPlan)
          if (parsed.aiPlan) setAiPlan(parsed.aiPlan as AIStudyPlan)
          if (parsed.aiExamDate) setAiExamDate(parsed.aiExamDate)
          if (parsed.aiSubjects) setAiSubjects(parsed.aiSubjects)
          if (parsed.aiDailyHours) setAiDailyHours(String(parsed.aiDailyHours))
          if (parsed.examType) setExamType(parsed.examType)
          if (parsed.subjectPriorityNotes) setSubjectPriorityNotes(parsed.subjectPriorityNotes)
          if (parsed.weakTopics) setWeakTopics(parsed.weakTopics)
          if (Array.isArray(parsed.studyStyles)) setStudyStyles(parsed.studyStyles)
          if (parsed.productivityLevel) setProductivityLevel(parsed.productivityLevel)
          if (parsed.breakPattern) setBreakPattern(parsed.breakPattern)
          if (typeof parsed.weeklyRestDay === "boolean") setWeeklyRestDay(parsed.weeklyRestDay)
          if (Array.isArray(parsed.revisionPrefs)) setRevisionPrefs(parsed.revisionPrefs)
          if (typeof parsed.timeSplitEnabled === "boolean") setTimeSplitEnabled(parsed.timeSplitEnabled)
          if (parsed.timeMorning != null) setTimeMorning(String(parsed.timeMorning))
          if (parsed.timeAfternoon != null) setTimeAfternoon(String(parsed.timeAfternoon))
          if (parsed.timeNight != null) setTimeNight(String(parsed.timeNight))
          if (typeof parsed.adaptivePlan === "boolean") setAdaptivePlan(parsed.adaptivePlan)
          if (parsed.motivationLevel) setMotivationLevel(parsed.motivationLevel)
        }
      } catch {
        // ignore corrupted saved plan
      }
    }
  }, [router])

  useEffect(() => {
    if (!email) return
    saveUserData(email, data)
  }, [email, data])

  const stats = useMemo(() => {
    const upcomingPlans = data.plans.filter((p) => !p.done).length
    const completedPlans = data.plans.filter((p) => p.done).length
    return { upcomingPlans, completedPlans }
  }, [data.plans])

  const recomputeTimeSplitError = (
    hoursValue: number,
    morning: string,
    afternoon: string,
    night: string,
    enabled: boolean
  ) => {
    if (!enabled) {
      setTimeSplitError(null)
      return
    }

    if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
      setTimeSplitError(null)
      return
    }

    const m = Number(morning) || 0
    const a = Number(afternoon) || 0
    const n = Number(night) || 0

    if (m < 0 || a < 0 || n < 0) {
      setTimeSplitError("Time slot hours cannot be negative.")
      return
    }

    const totalSlots = m + a + n
    if (totalSlots > hoursValue + 0.001) {
      setTimeSplitError("Your time slots add up to more than your daily study hours.")
      return
    }

    setTimeSplitError(null)
  }

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

  const generateAIPlan = async () => {
    const subjectsText = (aiSubjects || subjectPriorityNotes || weakTopics || "").trim()
    if (!subjectsText) {
      setAiError("Please add your subjects or notes (e.g. in the 'Subjects & weightage / priority' box).")
      return
    }
    const hours = Number(aiDailyHours)
    if (!Number.isFinite(hours) || hours <= 0) {
      setAiError("Please enter how many hours you can study per day.")
      return
    }

    if (timeSplitEnabled) {
      const m = Number(timeMorning) || 0
      const a = Number(timeAfternoon) || 0
      const n = Number(timeNight) || 0
      if (m < 0 || a < 0 || n < 0) {
        setAiError("Time slot hours cannot be negative.")
        return
      }
      const totalSlots = m + a + n
      if (totalSlots > hours + 0.001) {
        setAiError("Your morning+afternoon+night hours are more than your daily study hours.")
        return
      }
    }

    setAiError(null)
    setAiLoading(true)

    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examDate: aiExamDate,
          subjects: subjectsText,
          dailyHours: hours,
          preferences: {
            examType,
            subjectPriorityNotes,
            weakTopics,
            studyStyles,
            productivityLevel,
            breakPattern,
            weeklyRestDay,
            revisionPrefs,
            timeSplitEnabled,
            timeMorning: Number(timeMorning) || 0,
            timeAfternoon: Number(timeAfternoon) || 0,
            timeNight: Number(timeNight) || 0,
            adaptivePlan,
            motivationLevel,
          },
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setAiError(json.error || "Could not generate a study plan.")
        setAiPlan(null)
        setAiLoading(false)
        return
      }

      setAiPlan(json as AIStudyPlan)
      setSaveMessage(null)
    } catch (e) {
      console.error("AI study plan error", e)
      setAiError("Something went wrong while generating your plan. Please check your internet and try again.")
      setAiPlan(null)
    } finally {
      setAiLoading(false)
    }
  }

  const toggleStudyStyle = (style: string) => {
    setStudyStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    )
  }

  const toggleRevisionPref = (pref: string) => {
    setRevisionPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    )
  }

  const exportPlanAsPdf = async () => {
    if (!aiPlan) return
    try {
      const jsPDFModule = await import("jspdf")
      const doc = new (jsPDFModule as any).jsPDF({ orientation: "p", unit: "pt", format: "a4" })

      let y = 40
      const lineHeight = 14
      const marginX = 40

      const addLine = (text: string, options?: { bold?: boolean }) => {
        if (y > 780) {
          doc.addPage()
          y = 40
        }
        if (options?.bold) {
          doc.setFont(undefined, "bold")
        } else {
          doc.setFont(undefined, "normal")
        }
        doc.text(String(text), marginX, y)
        y += lineHeight
      }

      doc.setFontSize(18)
      doc.setFont(undefined, "bold")
      addLine("AI Study Plan", { bold: true })
      doc.setFontSize(11)
      y += 6

      if (aiExamDate) {
        addLine(`Exam date: ${aiExamDate}`)
      }
      addLine(`Daily hours: ${aiDailyHours}`)
      y += 6

      if (aiPlan.overview) {
        addLine("Overview:", { bold: true })
        const overviewLines = doc.splitTextToSize(String(aiPlan.overview), 520)
        for (const l of overviewLines) addLine(String(l))
        y += 6
      }

      if (Array.isArray(aiPlan.weeks)) {
        aiPlan.weeks.forEach((week, wIdx) => {
          addLine(week.weekLabel || `Week ${wIdx + 1}`, { bold: true })
          if (week.startDate || week.endDate) {
            addLine(`Dates: ${week.startDate || "?"} - ${week.endDate || "?"}`)
          }
          if (week.focus) {
            const focusLines = doc.splitTextToSize(String(week.focus), 520)
            focusLines.forEach((l: unknown) => addLine(String(l)))
          }
          if (Array.isArray(week.days)) {
            week.days.forEach((day, dIdx) => {
              addLine(`  • ${day.label || day.date || `Day ${dIdx + 1}`}`, { bold: true })
              if (day.date) addLine(`    (${day.date})`)
              if (Array.isArray(day.subjects)) {
                day.subjects.forEach((sub) => {
                  const base = `${sub.name || "Subject"} – ${sub.hours || "?"}h`
                  addLine(`    - ${base}`)
                  if (sub.topics) {
                    const topicLines = doc.splitTextToSize(String(sub.topics), 460)
                    topicLines.forEach((l: unknown) => addLine(`      ${String(l)}`))
                  }
                })
              }
            })
          }
          y += lineHeight
        })
      }

      if (Array.isArray(aiPlan.tips) && aiPlan.tips.length > 0) {
        addLine("Tips:", { bold: true })
        aiPlan.tips.forEach((tip, idx) => {
          const tipLines = doc.splitTextToSize(`${idx + 1}. ${tip}`, 520)
          tipLines.forEach((l: unknown) => addLine(String(l)))
        })
      }

      doc.save("study-plan.pdf")
    } catch (err) {
      console.error("PDF export failed", err)
    }
  }

  const openInGoogleCalendar = () => {
    if (!aiPlan) return
    if (typeof window === "undefined") return

    const today = new Date()
    const todayIso = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
      .toISOString()
      .slice(0, 10)

    const firstWeek = aiPlan.weeks?.[0]
    const lastWeek = aiPlan.weeks?.[aiPlan.weeks.length - 1]

    const firstDayFromDays = firstWeek?.days && firstWeek.days.length > 0
      ? firstWeek.days[0]?.date
      : undefined
    const firstDateStr = firstDayFromDays || firstWeek?.startDate || todayIso

    const lastDayFromDays = lastWeek?.days && lastWeek.days.length > 0
      ? lastWeek.days[lastWeek.days.length - 1]?.date
      : undefined
    const lastDateStr =
      lastDayFromDays || lastWeek?.endDate || aiExamDate || firstDateStr

    const toCalDate = (d: string) => d.replace(/-/g, "")

    const start = toCalDate(firstDateStr)
    const endDateObj = new Date(lastDateStr)
    const endInclusive = new Date(
      endDateObj.getFullYear(),
      endDateObj.getMonth(),
      endDateObj.getDate() + 1
    )
      .toISOString()
      .slice(0, 10)
    const end = toCalDate(endInclusive)

    const title = encodeURIComponent("Study plan – AI Study Buddy")
    const detailsParts: string[] = []
    if (aiPlan.overview) detailsParts.push(aiPlan.overview)
    if (Array.isArray(aiPlan.tips) && aiPlan.tips.length > 0) {
      detailsParts.push("Tips:\n" + aiPlan.tips.map((t, i) => `${i + 1}. ${t}`).join("\n"))
    }
    const details = encodeURIComponent(detailsParts.join("\n\n"))

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
    window.open(url, "_blank")
  }

  const saveCurrentPlanLocally = () => {
    if (!email || !aiPlan) return
    const payload = {
      aiPlan,
      aiExamDate,
      aiSubjects,
      aiDailyHours,
      examType,
      subjectPriorityNotes,
      weakTopics,
      studyStyles,
      productivityLevel,
      breakPattern,
      weeklyRestDay,
      revisionPrefs,
      timeSplitEnabled,
      timeMorning,
      timeAfternoon,
      timeNight,
      adaptivePlan,
      motivationLevel,
    }
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY_PREFIX + email, JSON.stringify(payload))
      setSaveMessage("Plan saved on this device.")
    } catch {
      setSaveMessage("Could not save plan (storage full or blocked).")
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-8 md:py-12 flex justify-center"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="w-full max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="physics-button inline-flex items-center gap-2 rounded-full border border-indigo-500/70 bg-indigo-500 px-3.5 py-1.5 text-xs font-medium text-slate-50 shadow-md shadow-indigo-500/30 transition-transform duration-150 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/40 active:translate-y-[1px]"
        >
          <span className="text-sm">←</span>
          <span>Back to dashboard</span>
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Study Planner & AI Roadmap
            </span>
          </h1>
          <p className="text-sm md:text-base text-soft max-w-2xl">
            Plan your revision topics and let your AI Study Buddy generate a realistic daily and weekly study roadmap.
          </p>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="scroll-reveal relative rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] overflow-hidden"
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

            <div className="flex flex-col md:flex-row gap-2 text-sm md:text-base">
              <input
                type="text"
                placeholder="Topic or chapter (e.g. Limits & Continuity)"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                className="flex-1 input-soft text-sm md:text-base py-3 px-4"
              />
              <input
                type="date"
                value={newPlanDate}
                onChange={(e) => setNewPlanDate(e.target.value)}
                className="input-soft text-sm md:text-base py-3 px-4 max-w-[180px]"
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
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm md:text-base transition flex items-center justify-between gap-3
                    ${plan.done
                      ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-900"
                      : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-400"}`}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium truncate text-sm md:text-base">{plan.title}</p>
                    <p className="text-[11px] md:text-xs text-slate-400">
                      {plan.done ? "Completed" : "Planned for"} {plan.date}
                    </p>
                  </div>
                  <span className="text-xl md:text-2xl">{plan.done ? "✅" : "⏳"}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="scroll-reveal relative rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-indigo-500/10 opacity-40 pointer-events-none" />
          <div className="relative space-y-4 text-[11px] md:text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="text-xs md:text-sm font-semibold">AI Study Plan (beta)</h3>
              </div>
              <span className="text-[10px] text-slate-400">Daily & weekly roadmap</span>
            </div>

            <div className="grid md:grid-cols-[0.8fr,1.2fr,0.7fr,0.9fr] gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400">Exam date</label>
                <input
                  type="date"
                  value={aiExamDate}
                  onChange={(e) => setAiExamDate(e.target.value)}
                  className="w-full input-soft text-[11px] py-1.5"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400">Exam type / goal</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full input-soft text-[11px] py-1.5 bg-transparent"
                >
                  <option value="semester">Semester exam</option>
                  <option value="competitive">Competitive exam (GATE, JEE, CAT, etc.)</option>
                  <option value="weekly-test">Weekly test</option>
                  <option value="revision-only">Revision only</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400">Daily hours</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  step={0.5}
                  value={aiDailyHours}
                  onChange={(e) => {
                    const value = e.target.value
                    setAiDailyHours(value)
                    const hoursValue = Number(value)
                    recomputeTimeSplitError(hoursValue, timeMorning, timeAfternoon, timeNight, timeSplitEnabled)
                  }}
                  className="w-full input-soft text-[11px] py-1.5"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400">Motivation level</label>
                <select
                  value={motivationLevel}
                  onChange={(e) => setMotivationLevel(e.target.value)}
                  className="w-full input-soft text-[11px] py-1.5 bg-transparent"
                >
                  <option value="low">Need motivation 😩</option>
                  <option value="normal">Normal 🙂</option>
                  <option value="strict">Strict mentor mode 😤</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">Subjects & weightage / priority</label>
                <textarea
                  value={subjectPriorityNotes}
                  onChange={(e) => setSubjectPriorityNotes(e.target.value)}
                  placeholder="e.g. Maths – High, Physics – Medium, Chemistry – Low"
                  className="w-full input-soft text-[11px] py-2 min-h-[60px] resize-y"
                />
                <label className="block text-[10px] text-slate-400">Topic-level weaknesses</label>
                <textarea
                  value={weakTopics}
                  onChange={(e) => setWeakTopics(e.target.value)}
                  placeholder="e.g. OS → Deadlocks (weak), DBMS → Normalization (medium)"
                  className="w-full input-soft text-[11px] py-2 min-h-[60px] resize-y"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">Preferred study style</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Reading", "Video", "Practice problems", "Flashcards", "Quizzes"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStudyStyle(style)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] md:text-[11px] transition ${
                        studyStyles.includes(style)
                          ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                          : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-indigo-400"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                <label className="block text-[10px] text-slate-400 mt-2">Productivity level / pace</label>
                <div className="space-y-1">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={productivityLevel === "chill" ? 1 : productivityLevel === "balanced" ? 2 : 3}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setProductivityLevel(v === 1 ? "chill" : v === 2 ? "balanced" : "aggressive")
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Chill 🐢</span>
                    <span>Balanced ⚖️</span>
                    <span>Aggressive 🚀</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400">Break & rest rules</label>
                <div className="flex flex-col gap-1.5 text-[10px] text-slate-300">
                  {["25-5", "50-10", "90-20"].map((pattern) => (
                    <label key={pattern} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        className="h-3 w-3"
                        checked={breakPattern === pattern}
                        onChange={() => setBreakPattern(pattern)}
                      />
                      <span>
                        {pattern === "25-5" && "Pomodoro (25–5)"}
                        {pattern === "50-10" && "50–10 focus blocks"}
                        {pattern === "90-20" && "90–20 deep work"}
                      </span>
                    </label>
                  ))}
                  <label className="inline-flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={weeklyRestDay}
                      onChange={(e) => setWeeklyRestDay(e.target.checked)}
                    />
                    <span>Include a weekly rest day</span>
                  </label>
                </div>

                <label className="block text-[10px] text-slate-400 mt-2">Revision strategy</label>
                <div className="flex flex-col gap-1.5 text-[10px] text-slate-300">
                  {["Daily quick revision", "Weekly revision", "Final revision sprint", "Spaced repetition"].map(
                    (pref) => (
                      <label key={pref} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={revisionPrefs.includes(pref)}
                          onChange={() => toggleRevisionPref(pref)}
                        />
                        <span>{pref}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={timeSplitEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      setTimeSplitEnabled(enabled)
                      const hoursValue = Number(aiDailyHours)
                      recomputeTimeSplitError(hoursValue, timeMorning, timeAfternoon, timeNight, enabled)
                    }}
                  />
                  <span>Advanced: daily time split</span>
                </label>
                {timeSplitEnabled && (
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="space-y-1">
                      <label className="block text-slate-400">Morning</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        step={0.5}
                        value={timeMorning}
                        onChange={(e) => {
                          const value = e.target.value
                          setTimeMorning(value)
                          const hoursValue = Number(aiDailyHours)
                          recomputeTimeSplitError(hoursValue, value, timeAfternoon, timeNight, timeSplitEnabled)
                        }}
                        className="input-soft text-[11px] py-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400">Afternoon</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        step={0.5}
                        value={timeAfternoon}
                        onChange={(e) => {
                          const value = e.target.value
                          setTimeAfternoon(value)
                          const hoursValue = Number(aiDailyHours)
                          recomputeTimeSplitError(hoursValue, timeMorning, value, timeNight, timeSplitEnabled)
                        }}
                        className="input-soft text-[11px] py-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400">Night</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        step={0.5}
                        value={timeNight}
                        onChange={(e) => {
                          const value = e.target.value
                          setTimeNight(value)
                          const hoursValue = Number(aiDailyHours)
                          recomputeTimeSplitError(hoursValue, timeMorning, timeAfternoon, value, timeSplitEnabled)
                        }}
                        className="input-soft text-[11px] py-1.5"
                      />
                    </div>
                  </div>
                )}

                {timeSplitError && (
                  <p className="text-[10px] text-red-300 mt-1">{timeSplitError}</p>
                )}

                <label className="inline-flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={adaptivePlan}
                    onChange={(e) => setAdaptivePlan(e.target.checked)}
                  />
                  <span>Adaptive plan: update based on performance</span>
                </label>

                <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                  <button
                    type="button"
                    onClick={generateAIPlan}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-3.5 py-1.5 font-medium text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-400 disabled:bg-slate-700 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {aiLoading ? "Generating plan..." : "Generate AI study plan"}
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentPlanLocally}
                    disabled={!aiPlan}
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    💾 Save plan
                  </button>
                  <button
                    type="button"
                    onClick={exportPlanAsPdf}
                    disabled={!aiPlan}
                    className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={aiPlan ? "Download this plan as PDF" : "Generate a plan first"}
                  >
                    📥 Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={openInGoogleCalendar}
                    disabled={!aiPlan}
                    className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 font-medium text-slate-200 hover:border-sky-400 hover:text-sky-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={aiPlan ? "Open in Google Calendar" : "Generate a plan first"}
                  >
                    📆 Add to Google Calendar
                  </button>
                </div>
                {saveMessage && (
                  <p className="text-[10px] text-emerald-300 mt-1">{saveMessage}</p>
                )}
              </div>
            </div>

          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="scroll-reveal relative rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)]"
        >
          <div className="relative space-y-3 text-[11px] md:text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h3 className="text-xs md:text-sm font-semibold">Study Plan Report</h3>
              </div>
              <span className="text-[10px] text-slate-400">Weekly timeline</span>
            </div>

            {aiError && (
              <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-[11px] text-red-100">
                {aiError}
              </div>
            )}

            {!aiError && !aiPlan && (
              <p className="text-[11px] text-slate-400">
                Generate an AI study plan above to see your detailed weekly report here.
              </p>
            )}

            {aiPlan && (
              <div className="space-y-4">
                {aiPlan.overview && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                      Overview
                    </p>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      {aiPlan.overview}
                    </p>
                    {studyStyles.length > 0 && (
                      <p className="text-[10px] text-slate-400">
                        Preferred study style: {studyStyles.join(" · ")}
                      </p>
                    )}
                  </div>
                )}

                {Array.isArray(aiPlan.weeks) && aiPlan.weeks.length > 0 && (
                  <div className="space-y-3">
                    {aiPlan.weeks.map((week, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl subcard-soft p-3 md:p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold text-slate-100">
                              {week.weekLabel || `Week ${idx + 1}`}
                            </p>
                            {week.focus && (
                              <p className="text-[10px] text-slate-400">
                                {week.focus}
                              </p>
                            )}
                          </div>
                          {(week.startDate || week.endDate) && (
                            <p className="text-[10px] text-slate-500">
                              {week.startDate}
                              {week.startDate && week.endDate ? " → " : ""}
                              {week.endDate}
                            </p>
                          )}
                        </div>

                        {Array.isArray(week.days) && week.days.length > 0 && (
                          <div className="mt-1 space-y-2">
                            {week.days.map((day, dIdx) => (
                              <div key={dIdx} className="flex gap-3">
                                <div className="flex flex-col items-center pt-1">
                                  <div className="h-3 w-3 rounded-full border-2 border-indigo-400 bg-slate-950 shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
                                  {dIdx !== ((week.days?.length ?? 0) - 1) && (
                                    <div className="w-px flex-1 bg-gradient-to-b from-indigo-400/80 via-slate-700/60 to-slate-800/0 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/70 px-3 py-2 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-[11px] font-semibold text-slate-100">
                                          {day.label || day.date || `Day ${dIdx + 1}`}
                                        </p>
                                        {day.date && (
                                          <p className="text-[10px] text-slate-500">
                                            {day.date}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {timeSplitEnabled && (() => {
                                      const parts: string[] = []
                                      const m = Number(timeMorning)
                                      const a = Number(timeAfternoon)
                                      const n = Number(timeNight)
                                      if (m > 0) parts.push(`${m}h morning`)
                                      if (a > 0) parts.push(`${a}h afternoon`)
                                      if (n > 0) parts.push(`${n}h night`)
                                      if (!parts.length) return null
                                      return (
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            <span className="font-semibold">Time slots:</span>{" "}
                                            {parts.join("  b7 ")}
                                        </p>
                                      )
                                    })()}
                                    {Array.isArray(day.subjects) && day.subjects.length > 0 && (
                                      <ul className="mt-1 space-y-0.5">
                                        {day.subjects.map((sub, sIdx) => (
                                          <li
                                            key={sIdx}
                                            className="flex items-start justify-between gap-2 text-[10px] text-slate-300"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <span className="font-medium break-words">
                                                {sub.name}
                                              </span>
                                              {sub.topics && (
                                                <span className="text-slate-400">
                                                  {" "}
                                                  – {sub.topics}
                                                </span>
                                              )}
                                            </div>
                                            {typeof sub.hours === "number" && sub.hours > 0 && (
                                              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 whitespace-nowrap">
                                                {sub.hours}h
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(aiPlan.tips) && aiPlan.tips.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                      Tips to follow
                    </p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      {aiPlan.tips.map((tip, idx) => (
                        <li key={idx} className="text-[10px] text-slate-400">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
