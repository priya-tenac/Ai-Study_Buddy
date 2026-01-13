import { NextResponse } from "next/server"

function getDaysUntilExam(examDateStr: string | null): { iso: string | null; daysUntil: number | null } {
  if (!examDateStr) return { iso: null, daysUntil: null }
  const exam = new Date(examDateStr)
  if (Number.isNaN(exam.getTime())) {
    return { iso: examDateStr, daysUntil: null }
  }
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfExam = new Date(exam.getFullYear(), exam.getMonth(), exam.getDate())
  const diffMs = startOfExam.getTime() - startOfToday.getTime()
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const iso = exam.toISOString().slice(0, 10)
  return { iso, daysUntil: days }
}

type SubjectConfig = {
  name: string
  weight: number
}

function parseSubjects(subjectsRaw: string): SubjectConfig[] {
  const lines = subjectsRaw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  return lines.map((line) => {
    const lower = line.toLowerCase()
    let weight = 1
    if (lower.includes("high")) weight = 3
    else if (lower.includes("medium")) weight = 2
    else if (lower.includes("low")) weight = 1

    const name = line.replace(/[-–:].*$/," ").trim() || line
    return { name, weight }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const examDateRaw = typeof body.examDate === "string" ? body.examDate.trim() : ""
    const subjectsRaw = typeof body.subjects === "string" ? body.subjects.trim() : ""
    const dailyHoursRaw = Number(body.dailyHours)

    if (!subjectsRaw) {
      return NextResponse.json({ error: "Please enter at least one subject" }, { status: 400 })
    }

    const dailyHours = Number.isFinite(dailyHoursRaw)
      ? Math.min(Math.max(dailyHoursRaw, 1), 12)
      : 3

    const { iso: examDateIso, daysUntil } = getDaysUntilExam(examDateRaw)

    const today = new Date()
    const todayIso = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
      .toISOString()
      .slice(0, 10)

    const totalDays = daysUntil && daysUntil > 0 ? daysUntil : 21
    const subjects = parseSubjects(subjectsRaw)
    const subjectsFallback: SubjectConfig[] = subjects.length
      ? subjects
      : [{ name: "General revision", weight: 1 }]

    const totalWeight = subjectsFallback.reduce((sum, s) => sum + s.weight, 0) || 1

    const weeks: any[] = []
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayIndex)
      const currentIso = currentDate.toISOString().slice(0, 10)
      const weekIndex = Math.floor(dayIndex / 7)
      const dayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "short" })

      if (!weeks[weekIndex]) {
        const weekStart = new Date(currentDate)
        const weekEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - (dayIndex % 7)))
        weeks[weekIndex] = {
          weekLabel: `Week ${weekIndex + 1}`,
          startDate: weekStart.toISOString().slice(0, 10),
          endDate: weekEnd.toISOString().slice(0, 10),
          focus: weekIndex === weeks.length
            ? "Warm-up and building foundations"
            : weekIndex === Math.floor(totalDays / 7) - 1
            ? "Final revisions and mock tests"
            : "Balanced practice and revision",
          days: [],
        }
      }

      const daySubjects = subjectsFallback.map((sub) => {
        const share = sub.weight / totalWeight
        const hours = Math.max(0.5, Math.round(dailyHours * share * 2) / 2)
        return {
          name: sub.name,
          topics: "Core concepts + 5-10 practice questions",
          hours,
        }
      })

      weeks[weekIndex].days.push({
        date: currentIso,
        label: dayOfWeek,
        subjects: daySubjects,
      })
    }

    const overview = `From ${todayIso} until ${examDateIso || "the exam"}, you will study about ${dailyHours} hour(s) per day across ${subjectsFallback.length} subject(s). Heavier-weight subjects get a larger share of time while still leaving room for revision and practice.`

    const tips = [
      "Stick to your daily hours, even if you cover slightly less than planned.",
      "Use a timer (Pomodoro or 50-10 blocks) so sessions stay focused.",
      "Mark weak topics as you go and give them extra time every few days.",
      "Keep one light revision-only day each week so you don't burn out.",
    ]

    return NextResponse.json({ overview, weeks, tips })
  } catch (err) {
    console.error("Study plan generation error", err)
    return NextResponse.json({ error: "Study plan generation failed" }, { status: 500 })
  }
}
