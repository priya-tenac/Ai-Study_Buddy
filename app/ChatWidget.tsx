"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'

type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
}

type Personality = "friendly" | "professional" | "simple" | "detailed" | "motivational"
type Subject = "math" | "science" | "history" | "english" | "programming" | "general"

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your AI Study Buddy. Ask me anything about your syllabus, concepts, or summaries. 🎓",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personality, setPersonality] = useState<Personality>("friendly")
  const [subject, setSubject] = useState<Subject>("general")
  const [showSettings, setShowSettings] = useState(false)
  const nextId = useRef(2)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
      }
    };
    
    checkAuth();
    window.addEventListener('focus', checkAuth);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleSend = async (generatePractice = false, explainDifferently = false) => {
    console.log('handleSend called:', { generatePractice, explainDifferently });
    
    // For quick actions, use the last user message; otherwise use input
    let messageToSend = input.trim();
    
    if (generatePractice || explainDifferently) {
      const userMessages = messages.filter(m => m.role === 'user');
      console.log('User messages:', userMessages);
      const lastUserMsg = userMessages[userMessages.length - 1];
      if (!lastUserMsg) {
        console.log('No user message found');
        setError('Please ask a question first before using quick actions.');
        return;
      }
      messageToSend = lastUserMsg.content;
      console.log('Using last user message:', messageToSend);
    }

    if (!messageToSend || loading) return;

    setError(null);
    setLoading(true);

    // Only add new user message if not using quick actions
    let updatedMessages = [...messages];
    if (!generatePractice && !explainDifferently) {
      const userMessage: ChatMessage = {
        id: nextId.current++,
        role: "user",
        content: messageToSend,
      };
      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
    }

    console.log('Sending to API:', { generatePractice, explainDifferently, messageCount: updatedMessages.length });

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
        body: JSON.stringify({ 
          messages: payloadMessages, 
          context,
          personality,
          subject,
          generatePractice,
          explainDifferently
        }),
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
      {!isLoggedIn ? (
        <button
          onClick={() => window.location.href = '/login'}
          className="physics-button flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:scale-105 transition-all"
        >
          <span className="text-lg">🔒</span>
          <span>Login to Chat</span>
        </button>
      ) : (
        <>
      {isOpen && (
        <div className="w-72 sm:w-80 md:w-[420px] rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 backdrop-blur-xl shadow-2xl shadow-indigo-500/20 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-500/30 bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-pink-600/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-base shadow-lg shadow-indigo-500/50 animate-pulse">
                🤖
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">AI Study Buddy</span>
                <span className="text-[10px] text-indigo-200">{personality} • {subject}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="h-7 w-7 rounded-full bg-slate-900/80 text-slate-300 text-xs hover:bg-slate-800"
              >
                ⚙️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full bg-slate-900/80 text-slate-300 text-xs hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="px-3 py-3 border-b border-slate-800 bg-slate-900/50 space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">AI Personality</label>
                <select 
                  value={personality} 
                  onChange={(e) => setPersonality(e.target.value as Personality)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200"
                >
                  <option value="friendly">😊 Friendly</option>
                  <option value="professional">👔 Professional</option>
                  <option value="simple">🎯 Simple</option>
                  <option value="detailed">📚 Detailed</option>
                  <option value="motivational">🚀 Motivational</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Subject Focus</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200"
                >
                  <option value="general">🌐 General</option>
                  <option value="math">🔢 Math</option>
                  <option value="science">🔬 Science</option>
                  <option value="history">📜 History</option>
                  <option value="english">📖 English</option>
                  <option value="programming">💻 Programming</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex-1 max-h-80 overflow-y-auto px-3 py-3 space-y-2 text-xs text-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-[11px] text-white shadow-lg shadow-indigo-500/30"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-2.5 text-[11px] border border-indigo-500/20 shadow-lg prose prose-invert prose-sm max-w-none"
                  }
                >
                  {m.role === "assistant" ? (
                    <div className="animate-fadeIn">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0 animate-slideUp" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-slate-100 animate-pulse" {...props} />,
                          code: ({node, ...props}) => <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300 animate-fadeIn" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 animate-slideUp" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 animate-slideUp" {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="animate-fadeIn">{m.content}</span>
                  )}
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
            {messages.filter(m => m.role === 'user').length > 0 && (
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => {
                    console.log('Practice button clicked');
                    handleSend(true, false);
                  }}
                  disabled={loading}
                  className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 transition"
                >
                  📝 Practice
                </button>
                <button
                  onClick={() => {
                    console.log('Explain Differently button clicked');
                    handleSend(false, true);
                  }}
                  disabled={loading}
                  className="text-[9px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 transition"
                >
                  🔄 Explain Differently
                </button>
              </div>
            )}
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
                onClick={() => handleSend()}
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
        className="physics-button relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl text-white shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-110 transition-all duration-300 animate-pulse"
        aria-label="Open study chat"
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 opacity-0 hover:opacity-100 transition-opacity blur-xl"></span>
        <span className="relative">🤖</span>
      </button>
      </>
      )}
    </div>
  )
}
