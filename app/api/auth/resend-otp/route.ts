import { NextResponse } from "next/server"
import { findUserByEmail, setUserOtpTokenById } from "../user-repository"
import { sendOtpEmail } from "../email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body || {}

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const payload = JSON.stringify({ otp, createdAt: Date.now() })

    try {
      await setUserOtpTokenById(user.id, payload)
    } catch (err) {
      console.error("RESEND_OTP: setUserOtpTokenById error", err)
      return NextResponse.json({ error: "Server error" }, { status: 500 })
    }

    try {
      await sendOtpEmail(email, otp)
    } catch (err) {
      console.error("RESEND_OTP: sendOtpEmail error", err)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("RESEND_OTP:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
