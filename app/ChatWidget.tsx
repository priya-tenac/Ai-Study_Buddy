"use client"

import { useState, useRef } from "react"

type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your AI Study Buddy. Ask me anything about your syllabus, concepts, or summaries.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextId = useRef(2)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    setError(null)

    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: "user",
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) {
        setError("Please log in to use the AI chat.")
        setLoading(false)
        return
      }

      let context: string | null = null
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("ai-study-buddy:context")
          if (raw) {
            const parsed = JSON.parse(raw)
            const title = typeof parsed.sourceTitle === "string" ? parsed.sourceTitle : "your latest study material"
            const summary = typeof parsed.summary === "string" ? parsed.summary : ""
            const baseText = typeof parsed.baseText === "string" ? parsed.baseText : ""
            const pieces = [
              `Source: ${title}`,
              summary ? `Summary: ${summary}` : "",
              baseText ? `Extracted content: ${baseText}` : "",
            ].filter(Boolean)
            context = pieces.join("\n\n").slice(0, 6000)
          }
        } catch {
          // ignore parsing errors
        }
      }

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
        body: JSON.stringify({ messages: payloadMessages, context }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired or not logged in. Please sign in and try again.")
        } else {
          setError(data.error || "Chat request failed. Please try again.")
        }
        return
      }

      const replyText: string = data.reply || ""
      const assistantMessage: ChatMessage = {
        id: nextId.current++,
        role: "assistant",
        content: replyText,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (e) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-72 sm:w-80 md:w-96 rounded-3xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-indigo-500/20 via-sky-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-500/80 flex items-center justify-center text-sm">
                💬
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-50">Study Buddy Chat</span>
                <span className="text-[10px] text-slate-400">Ask questions about anything youre studying</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full bg-slate-900/80 text-slate-300 text-xs hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 max-h-80 overflow-y-auto px-3 py-3 space-y-2 text-xs text-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-indigo-500 px-3 py-2 text-[11px] shadow-md"
                      : "max-w-[80%] rounded-2xl bg-slate-900 px-3 py-2 text-[11px] border border-slate-800"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900 px-3 py-1.5 text-[10px] text-slate-400 border border-slate-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 pb-1 text-[10px] text-red-300">{error}</div>
          )}

          <div className="px-3 pb-3 pt-1 border-t border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask a question about your study material..."
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="physics-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-xs text-white shadow-md shadow-indigo-500/40 disabled:bg-slate-700 disabled:shadow-none"
              >
                {loading ? "..." : "➤"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className="physics-button flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-xl text-white shadow-xl shadow-indigo-500/40 hover:bg-indigo-400"
        aria-label="Open study chat"
      >
        💬
      </button>
    </div>
  )
}
