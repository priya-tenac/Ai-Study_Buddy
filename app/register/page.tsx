"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 🔐 Password strength logic
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strength = getStrength()
  const passwordsMatch = password && confirm && password === confirm
  const canSubmit = strength >= 3 && passwordsMatch

  const handleRegister = async () => {
    if (!canSubmit) return
    setError(null)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
        return
      }

      setSuccess(true)

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch {
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
        {/* Left - marketing copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 bg-slate-900/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Study Buddy · Create account
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            <span
              className="text-scramble"
              data-scramble-text="Set up your"
            >
              Set up your
            </span>
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent"> learning workspace</span>
            .
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
          <p className="text-base md:text-lg text-slate-400 max-w-md">
            Build a secure account with a strong password and let the AI keep your notes, PDFs, and quizzes in sync.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex flex-col">
              <span className="font-medium text-slate-300">Secure by default</span>
              <span>Strong password checks built in.</span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="flex flex-col">
              <span className="font-medium text-slate-300">Designed for focus</span>
              <span>Clean UI, zero distractions.</span>
            </div>
          </div>
        </motion.div>

        {/* Right - register card */}
        <AnimatePresence mode="wait">
          {!success && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500/40 via-sky-500/30 to-purple-500/40 blur-xl opacity-60" />
              <div className="relative card-soft rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Create account</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      It only takes a minute to get started.
                    </p>
                  </div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-sm">
                    📝
                  </span>
                </div>

                {error && (
                  <div className="mb-3 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Password + Tooltip */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      Password
                      <span className="relative group cursor-pointer text-[11px] text-slate-400">
                        Secure tips
                        <div className="absolute left-0 top-6 z-10 hidden group-hover:block w-64 text-[11px] bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-700 shadow-xl">
                          Password must contain:
                          <ul className="list-disc ml-4 mt-1 space-y-0.5">
                            <li>At least 8 characters</li>
                            <li>1 uppercase letter</li>
                            <li>1 number</li>
                            <li>1 special character</li>
                          </ul>
                        </div>
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        type={show ? "text" : "password"}
                        placeholder="••••••••"
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 pr-12 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="physics-button absolute right-3 top-2.5 text-[11px] text-indigo-300 hover:text-indigo-200"
                      >
                        {show ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Strength Bar */}
                  <div className="mt-1 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-full rounded-full transition-colors
                            ${strength >= i
                              ? strength <= 1
                                ? "bg-red-500"
                                : strength === 2
                                ? "bg-yellow-400"
                                : strength === 3
                                ? "bg-blue-500"
                                : "bg-emerald-400"
                              : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {strength <= 1 && "Weak · Add more characters and variety."}
                      {strength === 2 && "Medium · Almost there, add a symbol."}
                      {strength === 3 && "Strong · Great, this looks solid."}
                      {strength === 4 && "Very Strong · Your account is well protected."}
                    </p>
                  </div>

                  {/* Confirm Password + Match Tick */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 mt-1 block">
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`mt-1 w-full rounded-xl border px-3 py-2 pr-9 text-sm outline-none focus:ring-2
                          ${confirm
                            ? passwordsMatch
                              ? "border-emerald-500 bg-emerald-500/5 focus:ring-emerald-500/40"
                              : "border-red-500 bg-red-500/5 focus:ring-red-500/40"
                            : "border-slate-800 bg-slate-900/60 focus:border-indigo-500 focus:ring-indigo-500/40"}`}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />

                      {confirm && (
                        <span className="absolute right-2.5 top-2.5 text-xs">
                          {passwordsMatch ? "✅" : "❌"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleRegister}
                    disabled={!canSubmit}
                    className={`physics-button mt-3 w-full rounded-xl py-2.5 text-sm font-medium transition
                      ${canSubmit
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
                  >
                    Create account
                  </button>

                  <p className="text-center text-[11px] text-slate-400 mt-3">
                    Already have an account?{" "}
                    <a href="/login" className="text-indigo-400 font-medium hover:text-indigo-300">
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ✅ SUCCESS ANIMATION */}
          {success && (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500/40 via-sky-500/30 to-indigo-500/40 blur-xl opacity-70" />
              <div className="relative card-soft bg-slate-950/80 rounded-3xl p-10 text-center shadow-2xl border border-slate-800">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-6xl"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-semibold mt-4">Account created!</h2>
                <p className="text-slate-400 mt-2 text-sm">
                  You&apos;ll be redirected to login in a moment.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
