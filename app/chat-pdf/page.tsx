"use client"

import { useState, type HTMLAttributes } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown, { type Components } from "react-markdown"

type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
}

function chunkText(text: string, chunkSize = 1500): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

function scoreChunk(chunk: string, question: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ")
  const qWords = new Set(
    normalize(question)
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )
  if (qWords.size === 0) return 0
  const words = normalize(chunk).split(/\s+/)
  let score = 0
  for (const w of words) {
    if (qWords.has(w)) score++
  }
  return score
}

export default function ChatWithPdfPage() {
  const router = useRouter()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState<string>("")
  const [chunks, setChunks] = useState<string[]>([])
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextId, setNextId] = useState(1)

  const handlePdfUpload = async (file: File | null) => {
    if (!file) return
    setPdfFile(file)
    setPdfName(file.name)
    setLoadingPdf(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to chat with PDFs.")
          return
        }
        setError(data.error || "Could not read PDF file.")
        return
      }

      const text = typeof data.text === "string" ? data.text : ""
      if (!text.trim()) {
        setError("No readable text found in this PDF.")
        return
      }

      const pdfChunks = chunkText(text, 1500)
      setChunks(pdfChunks)
      setMessages([
        {
          id: 0,
          role: "assistant",
          content:
            "PDF loaded. Ask me questions about this book or document, and I'll answer using its content.",
        },
      ])
    } catch (e) {
      setError("Something went wrong while reading the PDF.")
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleAsk = async () => {
    if (!input.trim() || loadingChat || chunks.length === 0) return

    setError(null)

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      setError("Please log in to chat with PDFs.")
      return
    }

    const userMessage: ChatMessage = {
      id: nextId,
      role: "user",
      content: input.trim(),
    }
    setNextId((id) => id + 1)
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoadingChat(true)

    try {
      // Simple retrieval over chunks
      const scored = chunks
        .map((chunk, index) => ({ index, score: scoreChunk(chunk, userMessage.content) }))
        .sort((a, b) => b.score - a.score)

      const top = scored.slice(0, 4).filter((s) => s.score > 0)
      const selectedChunks = (top.length > 0 ? top : scored.slice(0, 4)).map((s) => chunks[s.index])

      const contextText = selectedChunks.join("\n\n---\n\n").slice(0, 7000)

      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: payloadMessages,
          context: `You are chatting about the PDF: ${pdfName}. Use only the following extracted passages to answer.\n\n${contextText}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired or not logged in. Please sign in again.")
        } else {
          setError(data.error || "Chat request failed. Please try again.")
        }
        return
      }

      const reply: ChatMessage = {
        id: nextId + 1,
        role: "assistant",
        content: data.reply || "",
      }
      setNextId((id) => id + 2)
      setMessages((prev) => [...prev, reply])
    } catch (e) {
      setError("Something went wrong while chatting with the PDF.")
    } finally {
      setLoadingChat(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-stretch">
        {/* Left: PDF upload and info */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="physics-button inline-flex items-center gap-2 rounded-full border border-indigo-500/70 bg-indigo-500 px-3.5 py-1.5 text-xs font-medium text-slate-50 shadow-md shadow-indigo-500/30 transition-transform duration-150 hover:bg-indigo-400 hover:shadow-lg hover:shadow-indigo-500/40 active:translate-y-[1px] mb-2"
          >
            <span className="text-sm">←</span>
            <span>Back to dashboard</span>
          </button>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Chat with your <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">PDF</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md">
            Upload a textbook or PDF, then ask natural questions. I&apos;ll answer using the content of that document.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <label className="block text-xs font-medium text-slate-300 mb-1">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
              onChange={(e) => handlePdfUpload(e.target.files?.[0] || null)}
              disabled={loadingPdf}
            />
            {pdfName && (
              <p className="text-[11px] text-slate-400">Loaded: {pdfName}</p>
            )}
            {loadingPdf && (
              <p className="text-[11px] text-slate-400">Reading PDF and indexing sections...</p>
            )}
            {!loadingPdf && chunks.length > 0 && (
              <p className="text-[11px] text-slate-400">
                Indexed about {chunks.length} sections from this PDF. Your questions will use the most relevant ones.
              </p>
            )}
          </div>

          {error && (
            <div className="mt-2 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
              {error}
            </div>
          )}

          <div className="text-[11px] text-slate-500 mt-4 space-y-1">
            <p>Tips:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>Use specific questions ("Explain theorem 3.1" vs "Explain this book").</li>
              <li>For very large books, answers focus on the most relevant sections.</li>
              <li>You need to be logged in so the AI can answer.</li>
            </ul>
          </div>
        </div>

        {/* Right: chat area */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-indigo-500/20 via-sky-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-500/80 flex items-center justify-center text-sm">
                📄
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-50">PDF chat</span>
                <span className="text-[10px] text-slate-400">Ask questions grounded in your document</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-h-[420px] overflow-y-auto px-3 py-3 space-y-2 text-sm text-slate-50">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400">
                Upload a PDF on the left to start chatting about it.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-indigo-500 px-3 py-2 text-sm shadow-md prose prose-invert prose-sm"
                      : "max-w-[80%] rounded-2xl bg-slate-900 px-3 py-2 text-sm border border-slate-800 prose prose-invert prose-sm"
                  }
                >
                  <ReactMarkdown
                    components={{
                      h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
                        <h1 className="text-base font-semibold mb-1" {...props} />
                      ),
                      h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
                        <h2 className="text-sm font-semibold mt-2 mb-1" {...props} />
                      ),
                      h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
                        <h3 className="text-sm font-medium mt-1 mb-1" {...props} />
                      ),
                      p: (props: HTMLAttributes<HTMLParagraphElement>) => (
                        <p className="mb-1 leading-relaxed" {...props} />
                      ),
                      ul: (props: HTMLAttributes<HTMLUListElement>) => (
                        <ul
                          className="list-disc list-outside ml-4 mb-1 space-y-0.5"
                          {...props}
                        />
                      ),
                      ol: (props: HTMLAttributes<HTMLOListElement>) => (
                        <ol
                          className="list-decimal list-outside ml-4 mb-1 space-y-0.5"
                          {...props}
                        />
                      ),
                      li: (props: HTMLAttributes<HTMLLIElement>) => (
                        <li className="leading-relaxed" {...props} />
                      ),
                    } as Components}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900 px-3 py-1.5 text-[10px] text-slate-400 border border-slate-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Thinking with your PDF...
                </div>
              </div>
            )}
          </div>

          <div className="px-3 pb-3 pt-1 border-t border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAsk()
                  }
                }}
                placeholder={chunks.length === 0 ? "Upload a PDF first..." : "Ask a question about this PDF..."}
                disabled={chunks.length === 0 || loadingChat}
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-60"
              />
              <button
                onClick={handleAsk}
                disabled={loadingChat || !input.trim() || chunks.length === 0}
                className="physics-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-xs text-white shadow-md shadow-indigo-500/40 disabled:bg-slate-700 disabled:shadow-none"
              >
                {loadingChat ? "..." : "➤"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
