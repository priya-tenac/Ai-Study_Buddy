import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"
import { findUserByEmail, setUserOtpTokenById } from "../user-repository"

const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    const user = await findUserByEmail(email)

    if (!user || !user.verification_token) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    let parsed: { otp: string; createdAt: number } | null = null
    try {
      parsed = JSON.parse(user.verification_token) as { otp: string; createdAt: number }
    } catch {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    if (!parsed || parsed.otp !== otp) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    const now = Date.now()
    if (!parsed.createdAt || now - parsed.createdAt > OTP_TTL_MS) {
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 })
    }

    const secret = process.env.JWT_SECRET || "dev-secret"
    const token = jwt.sign({ email }, secret, { expiresIn: "7d" })

    // clear OTP after successful verification
    try {
      await setUserOtpTokenById(user.id, null)
    } catch (err) {
      console.error("VERIFY_OTP: clear token error", err)
    }

    return NextResponse.json({ token })
  } catch (err) {
    console.error("VERIFY_OTP ERROR", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
