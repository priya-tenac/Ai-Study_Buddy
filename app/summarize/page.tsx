"use client"
import { useState, useEffect, useRef, type HTMLAttributes } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import PptxGenJS from "pptxgenjs"
import { useRouter } from "next/navigation"

type Mode = "text" | "url" | "pdf" | "audio"

type Mcq = {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

type Flashcard = {
  front: string
  back: string
}

type SlideOutline = {
  title: string
  bullets: string[]
}

type StudySession = {
  id: string
  createdAt: string
  mode: Mode
  title: string
  summaryPreview: string
}

export default function SummarizePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("text")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [summary, setSummary] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [mcqs, setMcqs] = useState<Mcq[]>([])
  const [pptOutline, setPptOutline] = useState<SlideOutline[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [mindmap, setMindmap] = useState("")
  const [mindmapSvg, setMindmapSvg] = useState<string | null>(null)
  const [mindmapRendering, setMindmapRendering] = useState(false)
  const [mindmapError, setMindmapError] = useState<string | null>(null)
  const [maxWords, setMaxWords] = useState(200)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({})
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingRate, setSpeakingRate] = useState(1)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showCardBack, setShowCardBack] = useState(false)
  const [isCustomMaxWords, setIsCustomMaxWords] = useState(false)
  const [customMaxWords, setCustomMaxWords] = useState<number>(200)

  const STORAGE_KEY_PREFIX = "ai-study-buddy:user:"
  const CONTEXT_STORAGE_KEY = "ai-study-buddy:context"

  const summarizeText = async (content: string, wordLimit: number) => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null

    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: content, maxWords: wordLimit }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Summarization failed")
    }
    return data as {
      summary: string
      keywords: string[]
      mcqs: Mcq[]
      pptOutline: SlideOutline[]
      mindmap: string
      flashcards: Flashcard[]
    }
  }

  const decodeEmailFromToken = (token: string | null): string | null => {
    if (!token) return null
    try {
      const [, payload] = token.split(".")
      if (!payload) return null
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
      const json = atob(base64)
      const data = JSON.parse(json)
      return typeof data.email === "string" ? data.email : null
    } catch {
      return null
    }
  }

  const saveStudySession = (mode: Mode, sourceTitle: string, summaryText: string) => {
    if (typeof window === "undefined") return
    const token = window.localStorage.getItem("token")
    const email = decodeEmailFromToken(token)
    if (!email) return

    const key = STORAGE_KEY_PREFIX + email
    let existing: { sessions?: StudySession[]; plans?: unknown }
    try {
      const raw = window.localStorage.getItem(key)
      existing = raw ? JSON.parse(raw) : {}
    } catch {
      existing = {}
    }

    const sessions: StudySession[] = Array.isArray(existing.sessions)
      ? (existing.sessions as StudySession[])
      : []

    const session: StudySession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      mode,
      title: sourceTitle.slice(0, 80),
      summaryPreview: summaryText.replace(/\s+/g, " ").slice(0, 120),
    }

    const updated = {
      plans: Array.isArray(existing.plans) ? existing.plans : [],
      sessions: [...sessions, session].slice(-100),
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(updated))
    } catch {
      // ignore storage errors
    }
  }

  const saveStudyContext = (mode: Mode, sourceTitle: string, baseText: string, summaryText: string) => {
    if (typeof window === "undefined") return
    const token = window.localStorage.getItem("token")
    const email = decodeEmailFromToken(token)
    if (!email) return

    const compactBase = baseText.replace(/\s+/g, " ").slice(0, 4000)
    const compactSummary = summaryText.replace(/\s+/g, " ").slice(0, 2000)

    const payload = {
      email,
      mode,
      sourceTitle: sourceTitle.slice(0, 120),
      baseText: compactBase,
      summary: compactSummary,
      updatedAt: new Date().toISOString(),
    }

    try {
      window.localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore storage errors
    }
  }

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const summaryWordCount = summary
    ? summary
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0

  const handleSummarize = async () => {
    setError(null)
    setSummary("")
    setKeywords([])
    setMcqs([])
    setPptOutline([])
    setFlashcards([])
    setMindmap("")
    setLoading(true)

    try {
      let baseText = ""
      let sourceTitle = ""

      if (mode === "text") {
        if (!text.trim()) throw new Error("Please paste some text to summarize.")
        baseText = text
        sourceTitle = text.trim().slice(0, 80) || "Text input"
      } else if (mode === "url") {
        if (!url.trim()) throw new Error("Please enter a website or YouTube URL.")
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("token") : null
        const res = await fetch("/api/content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ url }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Could not load content from URL.")
        }
        baseText = data.text as string
        sourceTitle = url.trim()
      } else if (mode === "pdf") {
        if (!pdfFile) throw new Error("Please upload a PDF file.")
        const formData = new FormData()
        formData.append("file", pdfFile)
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("token") : null
        const res = await fetch("/api/pdf", {
          method: "POST",
          body: formData,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Could not read PDF file.")
        }
        baseText = data.text as string
        sourceTitle = pdfFile.name || "PDF upload"
      } else if (mode === "audio") {
        if (!audioFile) throw new Error("Please upload an audio file.")
        const formData = new FormData()
        formData.append("file", audioFile)
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("token") : null
        const res = await fetch("/api/audio", {
          method: "POST",
          body: formData,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Could not transcribe audio file.")
        }
        baseText = data.text as string
        sourceTitle = audioFile.name || "Audio upload"
      }

      const result = await summarizeText(baseText, maxWords)
      setSummary(result.summary)
      setKeywords(result.keywords || [])
      setMcqs(result.mcqs || [])
      setPptOutline(result.pptOutline || [])
      setMindmap(result.mindmap || "")
      setFlashcards(result.flashcards || [])
      setSelectedOptions({})
      setCurrentCardIndex(0)
      setShowCardBack(false)

      saveStudySession(mode, sourceTitle, result.summary || "")
      saveStudyContext(mode, sourceTitle, baseText, result.summary || "")
    } catch (e: any) {
      setError(e.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const tabClass = (current: Mode) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      mode === current
        ? "border-indigo-500 text-indigo-400"
        : "border-transparent text-slate-400 hover:text-slate-200"
    }`

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("token")
      if (!token) {
        router.push("/login")
      }
    }
  }, [router])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [summary])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("speechSynthesis" in window)) return

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      if (list.length) {
        setVoices(list)
        if (!selectedVoice && list[0]) {
          setSelectedVoice(list[0].name)
        }
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoice])

  useEffect(() => {
    if (!mindmap) {
      setMindmapSvg(null)
      setMindmapError(null)
      return
    }

    const removeMermaidErrorSvgs = () => {
      if (typeof document === "undefined") return
      const svgs = document.querySelectorAll("svg")
      svgs.forEach((el) => {
        if (el.textContent && el.textContent.includes("Syntax error in text")) {
          const parent = el.parentElement
          if (parent) parent.remove()
          else el.remove()
        }
      })
    }

    let cancelled = false
    setMindmapRendering(true)
    setMindmapError(null)

    ;(async () => {
      try {
        const mermaidModule = await import("mermaid")
        const mermaid = mermaidModule.default || mermaidModule
        mermaid.initialize({ startOnLoad: false, theme: "dark" })
        const { svg } = await mermaid.render("mindmap-" + Date.now(), mindmap)
        if (!cancelled) {
          if (typeof svg === "string" && svg.includes("Syntax error in text")) {
            setMindmapSvg(null)
            setMindmapError("Could not render mind map.")
          } else {
            setMindmapSvg(svg)
          }
        }
        removeMermaidErrorSvgs()
      } catch (e) {
        console.error("Mind map render error", e)
        if (!cancelled) {
          setMindmapError("Could not render mind map.")
        }
        removeMermaidErrorSvgs()
      } finally {
        if (!cancelled) setMindmapRendering(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mindmap])

  const startSpeaking = () => {
    if (typeof window === "undefined") return
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.")
      return
    }
    if (!summary) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(summary)
    utterance.rate = speakingRate
    const voice = voices.find((v) => v.name === selectedVoice)
    if (voice) {
      utterance.voice = voice
    }
    utterance.onend = () => {
      setIsSpeaking(false)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
    }
    utteranceRef.current = utterance
    setIsSpeaking(true)
    synth.speak(utterance)
  }

  const stopSpeaking = () => {
    if (typeof window === "undefined") return
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const downloadMindmapSvg = () => {
    if (!mindmapSvg) return
    const blob = new Blob([mindmapSvg], {
      type: "image/svg+xml;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-study-buddy-mindmap.svg"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadMindmapPdf = async () => {
    if (!mindmapSvg) return
    const jsPdfModule = await import("jspdf")
    const jsPDF = (jsPdfModule as any).jsPDF || (jsPdfModule as any).default
    const { Canvg } = await import("canvg")

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Try to respect SVG viewBox; fall back to a reasonable size
    const viewBoxMatch = mindmapSvg.match(/viewBox="([0-9.\s]+)"/)
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/).map(Number)
      if (parts.length === 4) {
        canvas.width = parts[2]
        canvas.height = parts[3]
      }
    }
    if (!canvas.width || !canvas.height) {
      canvas.width = 1200
      canvas.height = 800
    }

    const v = await Canvg.fromString(ctx, mindmapSvg)
    await v.render()

    const imgData = canvas.toDataURL("image/png")

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin,
      pageWidth - margin * 2,
      pageHeight - margin * 2
    )

    pdf.save("ai-study-buddy-mindmap.pdf")
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-8 md:py-12"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            <span
              className="text-scramble"
              data-scramble-text="Your AI study summarizer"
            >
              Your AI study summarizer
            </span>
          </h1>
          <p className="text-sm md:text-base text-soft max-w-2xl">
            Paste text, drop in a PDF, or just share a website / YouTube link.
            We&apos;ll generate a clean, focused summary you can revise from.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left: input modes */}
          <div className="scroll-reveal card-soft rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5 shadow-xl">
            <div className="flex gap-4 border-b border-slate-800 mb-4 overflow-x-auto">
              <button className={tabClass("text")} onClick={() => setMode("text")}>
                ✍️ Text
              </button>
              <button className={tabClass("url")} onClick={() => setMode("url")}>
                🔗 URL / YouTube
              </button>
              <button className={tabClass("pdf")} onClick={() => setMode("pdf")}>
                📄 PDF
              </button>
              <button className={tabClass("audio")} onClick={() => setMode("audio")}>
                🎙️ Audio file
              </button>
            </div>

            {mode === "text" && (
              <textarea
                rows={8}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Paste any notes, article, or explanation you want summarized..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}

            {mode === "url" && (
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Paste a website or YouTube URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">
                  YouTube links use the video title as a topic and generate an explanation with examples.
                </p>
              </div>
            )}

            {mode === "pdf" && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-400 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  We&apos;ll extract text from your PDF on the server and then summarize it.
                </p>
              </div>
            )}

            {mode === "audio" && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-400 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Upload a lecture, voice note, or podcast audio. We&apos;ll transcribe it first, then build your study pack.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>Summary length</span>
              <div className="flex items-center gap-2">
                <select
                  value={isCustomMaxWords ? "custom" : String(maxWords)}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "custom") {
                      setIsCustomMaxWords(true)
                      setMaxWords(customMaxWords || 200)
                    } else {
                      setIsCustomMaxWords(false)
                      const num = Number(value)
                      if (!Number.isNaN(num)) setMaxWords(num)
                    }
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="100">Short · 100 words</option>
                  <option value="200">Medium · 200 words</option>
                  <option value="300">Longer · 300 words</option>
                  <option value="400">Detailed · 400 words</option>
                  <option value="custom">Custom…</option>
                </select>
                {isCustomMaxWords && (
                  <input
                    type="number"
                    min={50}
                    max={1000}
                    value={customMaxWords}
                    onChange={(e) => {
                      const num = Number(e.target.value)
                      setCustomMaxWords(num)
                      if (!Number.isNaN(num) && num > 0) {
                        setMaxWords(num)
                      }
                    }}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="e.g. 250"
                  />
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}

            {summary && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-200">🎧 Podcast mode</span>
                  {isSpeaking && (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Speaking
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span>Rate</span>
                    <input
                      type="range"
                      min={0.7}
                      max={1.3}
                      step={0.1}
                      value={speakingRate}
                      onChange={(e) => setSpeakingRate(Number(e.target.value))}
                      className="w-24 cursor-pointer accent-indigo-500"
                    />
                    <span className="tabular-nums text-[10px] text-slate-400">
                      {speakingRate.toFixed(1)}x
                    </span>
                  </div>
                  {voices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span>Voice</span>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 max-w-[180px] truncate"
                      >
                        {voices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleSummarize}
              disabled={loading}
              className="physics-button mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
            >
              {loading ? "Summarizing..." : "Generate summary"}
            </button>
          </div>

          {/* Right: summary */}
          <div className="scroll-reveal card-soft rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5 shadow-xl min-h-[220px] space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="card-heading text-lg font-semibold flex items-center gap-2">
                <span>📘 Summary</span>
              </h2>
              {summary && (
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                  <div className="text-right text-[11px] leading-tight">
                    <div className="text-slate-200 font-medium">{summaryWordCount} words</div>
                    <div className="text-slate-400">Target {maxWords}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={isSpeaking ? stopSpeaking : startSpeaking}
                    className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                  >
                    {isSpeaking ? "Stop audio" : "Listen"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(summary)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      } catch {
                        // ignore clipboard errors
                      }
                    }}
                    className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!summary) return
                      const blob = new Blob([summary], { type: "text/plain;charset=utf-8" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "ai-study-buddy-summary.txt"
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                  >
                    Text file
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!summary) return
                      const jsPdfModule = await import("jspdf")
                      const jsPDF = (jsPdfModule as any).jsPDF || (jsPdfModule as any).default
                      const doc = new jsPDF({ unit: "pt", format: "a4" })
                      const margin = 40
                      let y = margin

                      doc.setFont("helvetica", "bold")
                      doc.setFontSize(18)
                      doc.text("AI Study Buddy Summary", margin, y)
                      y += 26

                      doc.setFont("helvetica", "normal")
                      doc.setFontSize(11)

                      const addWrappedText = (text: string) => {
                        const pageWidth = doc.internal.pageSize.getWidth()
                        const maxWidth = pageWidth - margin * 2
                        const lines = doc.splitTextToSize(text, maxWidth)
                        lines.forEach((line: string) => {
                          if (y > doc.internal.pageSize.getHeight() - margin) {
                            doc.addPage()
                            y = margin
                          }
                          doc.text(line, margin, y)
                          y += 14
                        })
                        y += 4
                      }

                      addWrappedText(summary)

                      if (keywords.length) {
                        if (y > doc.internal.pageSize.getHeight() - margin - 40) {
                          doc.addPage()
                          y = margin
                        }
                        doc.setFont("helvetica", "bold")
                        doc.setFontSize(13)
                        doc.text("Keywords", margin, y)
                        y += 18
                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(11)
                        addWrappedText("• " + keywords.join(", "))
                      }

                      if (mcqs.length) {
                        if (y > doc.internal.pageSize.getHeight() - margin - 60) {
                          doc.addPage()
                          y = margin
                        }
                        doc.setFont("helvetica", "bold")
                        doc.setFontSize(13)
                        doc.text("Practice MCQs", margin, y)
                        y += 18
                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(11)
                        mcqs.forEach((q, idx) => {
                          addWrappedText(`Q${idx + 1}. ${q.question}`)
                          q.options.forEach((opt) => addWrappedText(`- ${opt}`))
                          addWrappedText(`Answer: ${q.answer}`)
                          if (q.explanation) addWrappedText(`Why: ${q.explanation}`)
                          y += 6
                        })
                      }

                      if (flashcards.length) {
                        if (y > doc.internal.pageSize.getHeight() - margin - 60) {
                          doc.addPage()
                          y = margin
                        }
                        doc.setFont("helvetica", "bold")
                        doc.setFontSize(13)
                        doc.text("Flashcards", margin, y)
                        y += 18
                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(11)
                        flashcards.forEach((card, idx) => {
                          addWrappedText(`Card ${idx + 1} - Q: ${card.front}`)
                          addWrappedText(`A: ${card.back}`)
                          y += 4
                        })
                      }

                      doc.save("ai-study-buddy-notes.pdf")
                    }}
                    className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                  >
                    PDF Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                    if (!summary && pptOutline.length === 0) return
                    const pptx = new PptxGenJS()
                    const accent = "4F46E5" // indigo-600
                    const bg = "020617" // slate-950

                    // Title slide styled as a simple template
                    const titleSlide = pptx.addSlide()
                    // @ts-ignore - pptxgenjs background typing
                    titleSlide.background = { color: bg }
                    titleSlide.addText("AI STUDY BUDDY", {
                      x: 0.7,
                      y: 0.8,
                      fontSize: 32,
                      bold: true,
                      color: accent,
                      fontFace: "Arial",
                    })
                    titleSlide.addText("Summary & Key Concepts", {
                      x: 0.7,
                      y: 1.7,
                      fontSize: 20,
                      color: "E5E7EB", // slate-200
                      fontFace: "Arial",
                    })

                    const slides = pptOutline.length
                      ? pptOutline
                      : [{ title: "Key Points", bullets: summary.split("\n").slice(0, 8) }]

                    slides.forEach((slide) => {
                      const s = pptx.addSlide()
                      // @ts-ignore - pptxgenjs background typing
                      s.background = { color: bg }
                      s.addText(slide.title, {
                        x: 0.7,
                        y: 0.7,
                        fontSize: 26,
                        bold: true,
                        color: accent,
                        fontFace: "Arial",
                      })
                      s.addText(slide.bullets.join("\n"), {
                        x: 0.9,
                        y: 1.4,
                        fontSize: 18,
                        bullet: true,
                        color: "F9FAFB", // slate-50
                        fontFace: "Arial",
                      })
                    })

                    pptx.writeFile({ fileName: "ai-study-buddy-summary.pptx" })
                  }}
                  className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                >
                  Download PPT
                </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!summary) return
                      const payload = {
                        summary,
                        keywords,
                        mcqs,
                        flashcards,
                        mindmap,
                        pptOutline,
                      }
                      const blob = new Blob([JSON.stringify(payload, null, 2)], {
                        type: "application/json",
                      })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "ai-study-buddy-notes.json"
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                  >
                    Export JSON
                  </button>
                  </div>
                </div>
              )}
            </div>

            {summary ? (
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 summary-body">
                <ReactMarkdown
                  components={{
                    h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
                      <h1 className="text-xl font-semibold mb-2" {...props} />
                    ),
                    h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
                      <h2 className="text-lg font-semibold mt-3 mb-1" {...props} />
                    ),
                    h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
                      <h3 className="text-base font-semibold mt-2 mb-1" {...props} />
                    ),
                    p: (props: HTMLAttributes<HTMLParagraphElement>) => (
                      <p className="mb-1 leading-relaxed" {...props} />
                    ),
                    ul: (props: HTMLAttributes<HTMLUListElement>) => (
                      <ul className="list-disc list-outside ml-5 mb-1 space-y-0.5" {...props} />
                    ),
                    ol: (props: HTMLAttributes<HTMLOListElement>) => (
                      <ol className="list-decimal list-outside ml-5 mb-1 space-y-0.5" {...props} />
                    ),
                    li: (props: HTMLAttributes<HTMLLIElement>) => (
                      <li className="leading-relaxed" {...props} />
                    ),
                  } as Components}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Your summary will appear here once it&apos;s ready.
              </p>
            )}

            {keywords.length > 0 && (
              <div className="pt-1 border-t border-slate-800 mt-2">
                <h3 className="card-heading text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <span>🔑 Keywords</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1 text-xs text-slate-200"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {mcqs.length > 0 && (
              <div className="pt-2 border-t border-slate-800 mt-2 max-h-64 overflow-y-auto pr-1">
                <h3 className="card-heading text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <span>📝 Practice MCQs</span>
                </h3>
                <div className="space-y-3 text-xs md:text-sm">
                  {mcqs.map((q, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl subcard-soft bg-slate-900/70 border border-slate-800 p-3 text-left"
                    >
                      <p className="font-medium text-slate-100 mb-1">
                        Q{idx + 1}. {q.question}
                      </p>
                      <div className="space-y-1">
                        {q.options?.map((opt, i) => {
                          const chosen = selectedOptions[idx]
                          const isSelected = chosen === i
                          const isCorrect = opt === q.answer
                          const baseClasses =
                            "w-full text-left rounded-lg border px-3 py-1.5 text-xs md:text-sm transition mcq-option-soft"
                          let stateClasses = " hover:border-slate-500"

                          if (chosen != null) {
                            if (isSelected && isCorrect) {
                              stateClasses =
                                " border-emerald-500 bg-emerald-500/10 text-emerald-100"
                            } else if (isSelected && !isCorrect) {
                              stateClasses = " border-red-500 bg-red-500/10 text-red-100"
                            } else if (isCorrect) {
                              stateClasses =
                                " border-emerald-500/60 bg-emerald-500/5 text-emerald-100"
                            }
                          }

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                setSelectedOptions((prev) => ({ ...prev, [idx]: i }))
                              }
                              className={baseClasses + stateClasses}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                      {selectedOptions[idx] != null && (
                        <div className="mt-1 text-[11px]">
                          {q.options[selectedOptions[idx] ?? 0] === q.answer ? (
                            <p className="text-emerald-300">
                              Correct! <span className="font-semibold">{q.answer}</span>
                            </p>
                          ) : (
                            <p className="text-red-300">
                              Incorrect. Correct answer: {q.answer}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="mt-0.5 text-slate-400">Why: {q.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {flashcards.length > 0 && (
              <div className="pt-2 border-t border-slate-800 mt-2">
                <h3 className="card-heading text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <span>📚 Flashcards</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {currentCardIndex + 1} / {flashcards.length}
                  </span>
                </h3>
                <div className="rounded-xl subcard-soft bg-slate-900/70 border border-slate-800 p-3 text-left space-y-3">
                  <div className="text-xs md:text-sm">
                    <p className="text-slate-400 mb-1">Prompt</p>
                    <p className="font-medium text-slate-100">
                      {flashcards[currentCardIndex]?.front}
                    </p>
                  </div>
                  <div className="text-xs md:text-sm">
                    <button
                      type="button"
                      onClick={() => setShowCardBack((v) => !v)}
                      className="physics-button mb-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                    >
                      {showCardBack ? "Hide answer" : "Show answer"}
                    </button>
                    {showCardBack && (
                      <p className="mt-1 text-slate-200">
                        {flashcards[currentCardIndex]?.back}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-slate-400">How well did you know this?</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Again: re-queue current card soon by moving it after next card
                        if (flashcards.length <= 1) return
                        setFlashcards((cards) => {
                          const idx = currentCardIndex
                          const updated = [...cards]
                          const [card] = updated.splice(idx, 1)
                          updated.splice(idx + 1, 0, card)
                          return updated
                        })
                        setShowCardBack(false)
                      }}
                      className="physics-button rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-1.5 text-red-100 hover:border-red-400"
                    >
                      Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentCardIndex((idx) =>
                          idx + 1 < flashcards.length ? idx + 1 : idx
                        )
                        setShowCardBack(false)
                      }}
                      className="physics-button rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-1.5 text-amber-100 hover:border-amber-400"
                    >
                      Good
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentCardIndex((idx) =>
                          idx + 1 < flashcards.length ? idx + 1 : idx
                        )
                        setShowCardBack(false)
                      }}
                      className="physics-button rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-emerald-100 hover:border-emerald-400"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mindmap && (
              <div className="pt-2 border-t border-slate-800 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span>🧠 Mind Map</span>
                  </h3>
                  {mindmapSvg && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={downloadMindmapSvg}
                        className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                      >
                        Image (SVG)
                      </button>
                      <button
                        type="button"
                        onClick={downloadMindmapPdf}
                        className="physics-button rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200 hover:border-indigo-500 hover:text-indigo-200"
                      >
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                {mindmapRendering && (
                  <p className="text-xs text-slate-400">Generating mind map…</p>
                )}
                {mindmapError && (
                  <p className="text-xs text-red-300">{mindmapError}</p>
                )}
                {mindmapSvg && !mindmapRendering && !mindmapError && (
                  <div
                    className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 overflow-auto max-h-64"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: mindmapSvg }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
