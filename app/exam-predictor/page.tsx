"use client"

import { useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"

type PredictedTopic = {
  topic?: string
  reason?: string
  probability?: number
  sampleQuestions?: string[]
}

type ExamPrediction = {
  overview?: string
  strategy?: string
  topics?: PredictedTopic[]
  meta?: { caution?: string }
}

export default function ExamPredictorPage() {
  const router = useRouter()

  const [examName, setExamName] = useState("")
  const [syllabus, setSyllabus] = useState("")
  const [pastPapers, setPastPapers] = useState("")
  const [prediction, setPrediction] = useState<ExamPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handlePredict = async () => {
    if (!syllabus.trim() && !pastPapers.trim()) {
      setError("Paste your syllabus and/or past paper notes first.")
      return
    }
    setError(null)
    setLoading(true)

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null
      if (!token) {
        setError("Please log in to use the exam predictor.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/exam-predictor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examName, syllabus, pastPapers }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Could not generate exam predictions.")
        setPrediction(null)
        setLoading(false)
        return
      }

      setPrediction(json as ExamPrediction)
    } catch (e) {
      setError("Something went wrong while generating predictions.")
      setPrediction(null)
    } finally {
      setLoading(false)
    }
  }

  const formatProbability = (p?: number) => {
    if (typeof p !== "number" || Number.isNaN(p)) return "–"
    const clamped = Math.max(0, Math.min(1, p))
    return `${Math.round(clamped * 100)}%`
  }

  const handlePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadingPdf(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Could not read PDF.")
        setUploadingPdf(false)
        return
      }

      const text: string = json.text || ""
      if (text) {
        setPastPapers((prev) => (prev ? prev + "\n\n" + text : text))
      }
    } catch (e) {
      setError("Something went wrong while reading the PDF.")
    } finally {
      setUploadingPdf(false)
      event.target.value = ""
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Could not read image.")
        setUploadingImage(false)
        return
      }

      const text: string = json.text || ""
      if (text) {
        setPastPapers((prev) => (prev ? prev + "\n\n" + text : text))
      }
    } catch (e) {
      setError("Something went wrong while reading the image.")
    } finally {
      setUploadingImage(false)
      event.target.value = ""
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
            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              AI Exam Predictor
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl">
            Paste your syllabus and past paper questions, and your AI study buddy will highlight high-probability topics and example questions. Use this to sharpen your focus &mdash; not to skip the rest of the syllabus.
          </p>
        </div>

        <div className="grid md:grid-cols-[1.2fr,1.5fr] gap-5 items-start">
          {/* Left: inputs */}
          <section className="scroll-reveal rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] space-y-3">
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium" style={{ color: "var(--foreground)" }}>Exam name (optional)</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. JEE Main 2026, Semester 4 Control Systems"
                  className="input-soft text-xs md:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium" style={{ color: "var(--foreground)" }}>Syllabus / official topics</label>
                <textarea
                  rows={6}
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="input-soft text-xs md:text-sm"
                  placeholder="Paste the official syllabus, chapters, or topic list here."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium" style={{ color: "var(--foreground)" }}>Past papers & patterns</label>
                <textarea
                  rows={6}
                  value={pastPapers}
                  onChange={(e) => setPastPapers(e.target.value)}
                  className="input-soft text-xs md:text-sm"
                  placeholder="Paste recent questions, chapters that repeat, or your notes about what usually shows up."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px]">
                <span className="text-soft">Upload instead:</span>
                <label className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 cursor-pointer text-slate-700 hover:border-indigo-400 hover:text-indigo-600">
                  <span>📄</span>
                  <span>PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                </label>
                <label className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 cursor-pointer text-slate-700 hover:border-indigo-400 hover:text-indigo-600">
                  <span>🖼️</span>
                  <span>Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {uploadingPdf && (
                  <span className="text-[10px] text-soft">Reading PDF…</span>
                )}
                {uploadingImage && (
                  <span className="text-[10px] text-soft">Processing image…</span>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handlePredict}
                disabled={loading}
                className="physics-button mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition"
              >
                {loading ? "Analyzing patterns..." : "Predict exam hotspots"}
              </button>

              <p className="text-[10px] text-soft mt-1">
                Predictions are guidance only. Always cover the full syllabus.
              </p>
            </div>
          </section>

          {/* Right: predictions */}
          <section className="scroll-reveal rounded-2xl card-soft p-4 md:p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] space-y-3 min-h-[220px]">
            {!prediction ? (
              <p className="text-[11px] md:text-sm text-slate-500">
                Once you paste your syllabus and past paper notes and run the predictor, you&apos;ll see likely topics, reasons, and sample questions here.
              </p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {prediction.overview && (
                  <p className="text-xs md:text-sm text-soft summary-body">{prediction.overview}</p>
                )}
                {prediction.strategy && (
                  <p className="text-[11px] md:text-sm text-soft">
                    <span className="font-semibold text-emerald-600">Strategy: </span>
                    {prediction.strategy}
                  </p>
                )}

                {Array.isArray(prediction.topics) && prediction.topics.length > 0 && (
                  <div className="space-y-2">
                    {prediction.topics.map((t, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl subcard-soft px-3 py-2 space-y-1 text-[11px] md:text-xs text-soft"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold truncate max-w-[220px] md:max-w-[260px]">
                            {t.topic || `Topic ${idx + 1}`}
                          </p>
                          <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] text-emerald-700">
                            {formatProbability(t.probability)}
                          </span>
                        </div>
                        {t.reason && (
                          <p className="text-[10px] md:text-[11px] text-soft">{t.reason}</p>
                        )}
                        {Array.isArray(t.sampleQuestions) && t.sampleQuestions.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-[10px] font-medium" style={{ color: "var(--foreground)" }}>Sample questions</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {t.sampleQuestions.map((q, qIdx) => (
                                <li key={qIdx} className="text-[10px] md:text-[11px] text-soft">
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {prediction.meta?.caution && (
                  <p className="text-[10px] text-amber-700 border-t border-slate-200 pt-2">
                    {prediction.meta.caution}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
