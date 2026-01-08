"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Script from "next/script"
import { motion } from "framer-motion"

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const justVerified = searchParams.get("verified") === "1"

  const handleLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.token) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("token", data.token)
          } catch {
            // ignore storage errors
          }
        }
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed. Please check your details.")
      }
    } catch (e) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (response: any) => {
    setGoogleError(null)
    try {
      const idToken = response?.credential
      if (!idToken) return

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (res.ok && data.token) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("token", data.token)
          } catch {
            // ignore storage errors
          }
        }
        router.push("/dashboard")
      } else {
        setGoogleError(data.error || "Google sign-in failed. Please try again.")
      }
    } catch (e) {
      setGoogleError("Google sign-in failed. Please try again.")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
        {/* Left side - brand / hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 bg-slate-900/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Study Buddy · AI powered
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Welcome back to your
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent"> smart study space.</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-md">
            Log in to access your AI summaries, saved PDFs, and personalized learning sessions—all in one clean dashboard.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex flex-col">
              <span className="font-medium text-slate-300">Fast summaries</span>
              <span>Turn long PDFs into key insights.</span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="flex flex-col">
              <span className="font-medium text-slate-300">Focus mode</span>
              <span>Stay on track with quiz-style prompts.</span>
            </div>
          </div>
        </motion.div>

        {/* Right side - auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500/40 via-sky-500/30 to-purple-500/40 blur-xl opacity-60" />
          <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Sign in</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Use the account you created to continue.
                </p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-sm">
                🔐
              </span>
            </div>

            {justVerified && (
              <div className="mb-3 rounded-xl border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                Email verified successfully. You can now sign in.
              </div>
            )}

            {(error || googleError) && (
              <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error || googleError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  New to Study Buddy?{" "}
                  <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Create an account
                  </a>
                </span>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="physics-button mt-2 inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
              >
                {loading ? "Signing you in..." : "Continue"}
              </button>

              <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
                <div className="h-px flex-1 bg-slate-800" />
                <span>or</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <div className="mt-3 flex justify-center">
                <div id="google-signin-button" className="w-full flex justify-center" />
              </div>
            </div>
          </div>
          <Script
            src="https://accounts.google.com/gsi/client"
            async
            defer
            onLoad={() => {
              if (!window.google) return
              const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
              if (!clientId) {
                console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set")
                return
              }
              console.log("GIS clientId:", clientId)
              console.log("Origin:", window.location.origin)
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredential,
              })
              const btn = document.getElementById("google-signin-button")
              if (btn) {
                window.google.accounts.id.renderButton(btn, {
                  theme: "outline",
                  size: "large",
                  shape: "pill",
                  width: "100%",
                  text: "continue_with",
                })
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
