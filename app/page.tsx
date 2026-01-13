"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const heroBlocks = [
  "PDFs",
  "YouTube",
  "Exam notes",
  "Chat prompts",
]

const howItWorks = [
  {
    title: "PDF Summarizer",
    description: "Upload any PDF and get a clean, exam-ready summary in seconds.",
    icon: "📄",
  },
  {
    title: "YouTube Summarizer",
    description: "Paste a lecture link and turn it into notes, MCQs, and flashcards.",
    icon: "▶️",
  },
  {
    title: "AI Exam Notes",
    description: "Turn textbook chapters into focused revision sheets with examples.",
    icon: "🎓",
  },
  {
    title: "Chat with Notes",
    description: "Ask questions on top of your notes and get simple answers.",
    icon: "💬",
  },
]

const summaryTypes = [
  {
    label: "PDF AI Summary",
    icon: "📑",
  },
  {
    label: "YouTube Video Summary",
    icon: "📺",
  },
  {
    label: "AI Exam Notes",
    icon: "📝",
  },
]

const coreFeatures = [
  {
    title: "Smart Notes & Summaries",
    description:
      "Summarize PDFs, web content, and lectures into clean, exam-focused notes, MCQs, and flashcards.",
    icon: "🧠",
    href: "/summarize",
    badge: "Smart Notes",
  },
  {
    title: "Personalized Study Planner",
    description:
      "Set your exam date and daily hours; let AI build you a realistic weekly and daily plan.",
    icon: "📅",
    href: "/dashboard",
    badge: "Planner & habits",
  },
  {
    title: "Progress & Analytics",
    description:
      "Track PDFs summarized, MCQs attempted, accuracy %, and study streaks with clean charts.",
    icon: "📊",
    href: "/dashboard",
    badge: "Stats & streaks",
  },
  {
    title: "AI Exam Predictor",
    description:
      "Feed in syllabus, past papers, PDFs, or images and get high-probability topics and questions.",
    icon: "🎯",
    href: "/exam-predictor",
    badge: "Exam hotspots",
  },
  {
    title: "AI Quiz Battle",
    description:
      "Play solo or friend vs friend battles where accuracy and speed decide the winner.",
    icon: "⚔️",
    href: "/quiz-battle",
    badge: "Game mode",
  },
]

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLAnchorElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from(".hero-badge", {
        y: -12,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      })

      gsap.from(".hero-title-line", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.1,
      })

      gsap.to(".hero-scramble", {
        duration: 2.5,
        scrambleText: {
          text: "AI-powered smart notes.",
          chars: "upperAndLowerCase",
          revealDelay: 0.2,
          speed: 0.3,
        },
        delay: 0.7,
        ease: "none",
      })

      gsap.from(".hero-copy", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.3,
      })

      gsap.from(".hero-cta-wrapper", {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.4,
      })

      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          scale: 1.04,
          y: -4,
          duration: 1.4,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
        })
      }

      if (cardRef.current) {
        gsap.from(cardRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.4,
        })

        gsap.to(cardRef.current, {
          y: -10,
          duration: 3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        })
      }

      gsap.to(".floating-pill", {
        y: -12,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      })

      if (heroRef.current) {
        gsap.to(heroRef.current, {
          y: -80,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        })
      }
    }, heroRef)
    
    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <main
      id="smooth-wrapper"
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div id="smooth-content">
        {/* soft floating glows behind everything */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
          data-speed="0.7"
        >
          <div className="absolute -left-36 top-6 h-64 w-64 rounded-full bg-fuchsia-400/25 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/25 blur-3xl" />
          <div className="absolute right-[-5rem] top-24 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute left-1/3 bottom-[-6rem] h-80 w-80 rounded-full bg-purple-500/25 blur-3xl" />
        </div>

        {/* HERO */}
        <section
          ref={heroRef}
          className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-20 md:flex-row md:items-center md:pb-28 md:pt-24"
        >
        <div className="relative z-10 flex-1 space-y-6 md:space-y-8">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-3 py-1 text-[11px] text-indigo-100 shadow-[0_0_24px_rgba(129,140,248,0.4)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Study Buddy · AI powered</span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            <span className="hero-title-line block">Study smarter,</span>
            <span className="hero-title-line hero-scramble block bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
              not harder.
            </span>
          </h1>

          <div className="mt-3 h-6">
            <svg
              viewBox="0 0 200 40"
              className="h-full w-40 text-indigo-300/80"
              aria-hidden="true"
            >
              <path
                className="draw-svg-path"
                d="M4 30 C 40 8, 80 8, 120 30 S 196 52, 196 30"
                stroke="currentColor"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="hero-copy max-w-xl text-sm text-soft md:text-base">
            AI summaries, notes, and study plans tailored to you from PDFs, YouTube videos, and raw topics—so you can revise
            faster and remember more.
          </p>

          <div className="hero-cta-wrapper flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <a
              href="/login"
              ref={buttonRef}
              className="physics-button inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-400 px-8 py-2.5 text-sm font-semibold text-white shadow-[0_15px_45px_rgba(79,70,229,0.7)] transition hover:brightness-110"
            >
              Get started
            </a>
            <a
              href="/summarize"
              className="inline-flex items-center justify-center rounded-full border border-slate-300/70 bg-white/90 px-7 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_14px_40px_rgba(148,163,184,0.45)] backdrop-blur hover:border-violet-400/80 hover:text-violet-700"
            >
              Try demo
            </a>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-soft md:text-sm">
            <div className="flex flex-col">
              <span className="text-slate-200">Fast summaries</span>
              <span>Turn long PDFs into key insights in seconds.</span>
            </div>
            <div className="h-10 w-px bg-slate-800/70" />
            <div className="flex flex-col">
              <span className="text-slate-200">Focus mode</span>
              <span>Stay on track with MCQs and flashcards.</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-soft">
            {heroBlocks.map((b) => (
              <span
                key={b}
                className="floating-pill inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* glass hero card */}
        <div className="relative z-10 flex-1" data-speed="1.15" data-lag="0.08">
          <div
            ref={cardRef}
            className="mx-auto max-w-md rounded-3xl border border-indigo-400/40 bg-slate-900/70 p-4 shadow-[0_0_80px_rgba(129,140,248,0.7)] backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center justify-between text-[11px] text-soft">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live study pack
              </span>
              <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-2 py-0.5 text-[10px]">
                AI generated
              </span>
            </div>

            <div className="space-y-3 card-soft rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
                    📘
                  </span>
                  <span>
                    Thermodynamics – <span className="text-indigo-300">Lecture 4</span>
                  </span>
                </span>
                <span className="text-[10px] text-slate-500">Summary · MCQs · Mind map</span>
              </div>

              <div className="mt-2 grid grid-cols-[1.2fr,0.9fr] gap-3 text-[11px] text-slate-200">
                <div className="space-y-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5">
                  <p className="mb-1 text-xs font-semibold text-slate-100">Key takeaways</p>
                  <ul className="space-y-0.5 text-[11px] text-slate-300">
                    <li>• First law links internal energy, heat, and work.</li>
                    <li>• Closed vs open systems in real exam problems.</li>
                    <li>• Common traps your teacher loves to ask.</li>
                  </ul>
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5">
                  <p className="text-xs font-semibold text-slate-100">Practice MCQ</p>
                  <div className="space-y-1">
                    <button className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-left text-[11px] text-slate-200 hover:border-emerald-500/70">
                      Heat added at constant volume mainly changes…
                    </button>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Tap to reveal answer</span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                        12 cards
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 text-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  Saved to dashboard
                </span>
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-slate-300">Summary</span>
                  <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-slate-300">Flashcards</span>
                  <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-slate-300">Mind map</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALL FEATURES OVERVIEW */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24">
        <div className="scroll-reveal space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-soft">Everything in one place</p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            All your study tools in a single AI workspace.
          </h2>
          <p className="mx-auto max-w-2xl text-xs text-soft md:text-sm">
            From instant notes to long-term plans, analytics, exam predictions, and quiz battles—your dashboard keeps
            everything organised and synced for exam day.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {coreFeatures.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              className="scroll-reveal card-soft flex flex-col justify-between rounded-2xl p-4 text-left shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition hover:border-indigo-300/70 hover:shadow-[0_12px_60px_rgba(79,70,229,0.15)]"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[11px] text-soft">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-lg">
                    {feature.icon}
                  </span>
                  <span className="rounded-full border border-slate-200/70 bg-white/80 px-2 py-0.5 text-[10px] text-soft">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="card-heading text-sm font-semibold">{feature.title}</h3>
                <p className="text-[11px] text-soft leading-relaxed">{feature.description}</p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-indigo-500">
                Open tool
                <span aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* QUICK START GUIDE */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="scroll-reveal grid gap-6 rounded-3xl card-soft p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] md:grid-cols-[1.1fr,1fr]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-soft">New here?</p>
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">Get value from AI Study Buddy in 60 seconds.</h2>
            <ol className="space-y-2 text-[11px] text-soft md:text-xs">
              <li>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>1. Drop in your material.</span> Open <a href="/summarize" className="text-indigo-500 underline-offset-2 hover:underline">Smart Notes</a> and
                upload a PDF, paste text, or describe a topic.
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>2. Save it to your dashboard.</span> Review the summary, MCQs, and flashcards, then pin useful packs to your
                dashboard.
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>3. Plan and track.</span> Use the <a href="/dashboard" className="text-indigo-500 underline-offset-2 hover:underline">Study Planner & Analytics</a> to create a schedule and watch your
                streaks grow.
              </li>
            </ol>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
              <a
                href="/login"
                className="physics-button inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-1.5 font-medium text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-400"
              >
                Sign in and open dashboard
              </a>
              <a
                href="/summarize"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 font-medium text-slate-800 hover:border-indigo-400 hover:text-indigo-700"
              >
                Try a free summary
              </a>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl subcard-soft p-4 text-[11px] text-soft">
            <p className="text-xs font-semibold text-indigo-600">Great for</p>
            <ul className="space-y-1.5">
              <li>• Last‑week exam revision from messy PDFs and slides.</li>
              <li>• Turning long lectures into short, searchable notes.</li>
              <li>• Creating daily/weekly plans when you&apos;re overwhelmed.</li>
              <li>• Friendly quiz battles to revise with classmates.</li>
            </ul>
            <p className="pt-2 text-[10px] text-soft">
              No complex setup: just log in, add material, and let your AI buddy handle the organisation.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ STRIP */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24">
        <div className="scroll-reveal grid gap-4 rounded-3xl card-soft p-5 text-[11px] text-soft md:grid-cols-[1.1fr,1.3fr] md:text-xs shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-soft">FAQ</p>
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">Quick answers before you start.</h2>
            <p>
              AI Study Buddy keeps everything on your dashboard so you can come back to the same notes, plans, and
              analytics any time you log in.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl subcard-soft p-3">
              <p className="mb-1 text-[11px] font-semibold md:text-xs" style={{ color: "var(--foreground)" }}>Is my data saved?</p>
              <p>
                Yes. Summaries, quizzes, and plans are stored per account so only you can see them on your dashboard.
              </p>
            </div>
            <div className="rounded-2xl subcard-soft p-3">
              <p className="mb-1 text-[11px] font-semibold md:text-xs" style={{ color: "var(--foreground)" }}>What can I upload?</p>
              <p>
                PDFs, text, links, and images of notes or papers. The AI turns them into clean, exam‑ready material.
              </p>
            </div>
            <div className="rounded-2xl subcard-soft p-3">
              <p className="mb-1 text-[11px] font-semibold md:text-xs" style={{ color: "var(--foreground)" }}>Does it replace my own study?</p>
              <p>
                No—think of it as a fast assistant. You still revise, but it handles the heavy lifting and organisation.
              </p>
            </div>
            <div className="rounded-2xl subcard-soft p-3">
              <p className="mb-1 text-[11px] font-semibold md:text-xs" style={{ color: "var(--foreground)" }}>Can I study with friends?</p>
              <p>
                Yes. Use AI Quiz Battle for solo or friend vs friend games where accuracy and time decide the winner.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </main>
  )
}
