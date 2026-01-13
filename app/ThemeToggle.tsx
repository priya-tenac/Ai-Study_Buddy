"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

const THEME_KEY = "ai-study-buddy-theme"

type Theme = "light" | "dark"

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(THEME_KEY) as Theme | null
  if (stored === "light" || stored === "dark") return stored
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark")
  const knobRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const initial = getInitialTheme()
    setTheme(initial)
    document.documentElement.dataset.theme = initial
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_KEY, theme)

    if (knobRef.current) {
      gsap.to(knobRef.current, {
        x: theme === "dark" ? 0 : 24,
        duration: 0.25,
        ease: "power2.out",
      })
      gsap.fromTo(
        knobRef.current,
        { rotate: theme === "dark" ? -10 : 10 },
        { rotate: 0, duration: 0.4, ease: "elastic.out(1, 0.7)" }
      )
    }
  }, [theme])

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-300 shadow-lg shadow-slate-950/40 backdrop-blur-md hover:border-indigo-400 hover:text-indigo-100 transition-colors"
    >
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"} mode</span>
      <div className="relative h-6 w-12 rounded-full bg-slate-800/80 border border-slate-600 flex items-center px-1.5">
        <div
          ref={knobRef}
          className="h-5 w-5 rounded-full bg-gradient-to-tr from-amber-300 to-amber-100 shadow-md shadow-amber-400/40 flex items-center justify-center text-[10px]"
        >
          {isDark ? "🌙" : "☀️"}
        </div>
      </div>
    </button>
  )
}
