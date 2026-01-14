import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-slate-900/80 bg-slate-950/90 text-[11px] text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2 text-slate-400">
          <span className="hidden md:inline">
            <img
              src="/globe.svg"
              alt="Logo"
              width={20}
              height={20}
              style={{ display: 'inline-block', verticalAlign: 'middle', minWidth: 20, minHeight: 20 }}
            />
          </span>
          <span>
            © {new Date().getFullYear()} AI Study Buddy. Study smarter, not harder.
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="text-slate-500">Quick links:</span>
          <Link
            href="/summarize"
            className="rounded-full border border-slate-800 bg-slate-900/70 px-2 py-0.5 hover:border-indigo-400 hover:text-indigo-200"
          >
            Smart Notes
          </Link>
          <Link
            href="/study-planner"
            className="rounded-full border border-slate-800 bg-slate-900/70 px-2 py-0.5 hover:border-indigo-400 hover:text-indigo-200"
          >
            Study Planner
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-800 bg-slate-900/70 px-2 py-0.5 hover:border-indigo-400 hover:text-indigo-200"
          >
            Analytics
          </Link>
          <Link
            href="/exam-predictor"
            className="rounded-full border border-slate-800 bg-slate-900/70 px-2 py-0.5 hover:border-indigo-400 hover:text-indigo-200"
          >
            Exam Predictor
          </Link>
          <Link
            href="/quiz-battle"
            className="rounded-full border border-slate-800 bg-slate-900/70 px-2 py-0.5 hover:border-indigo-400 hover:text-indigo-200"
          >
            AI Quiz Battle
          </Link>
        </div>
      </div>
    </footer>
  )
}
