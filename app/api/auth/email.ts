import nodemailer from "nodemailer"

export async function sendOtpEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user

  if (!host || !user || !pass) {
    console.warn("SMTP credentials are not fully configured; skipping OTP email send.")
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Your AI Study Buddy login code</h1>
      <p style="margin-bottom: 12px;">Use the one-time code below to finish signing in. It works for a short time and can only be used once.</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em; margin: 16px 0;">${otp}</p>
      <p style="font-size: 13px; color: #6b7280;">If you didn't try to sign in, you can ignore this email.</p>
    </div>
  `

  await transporter.sendMail({
    from,
    to,
    subject: "Your AI Study Buddy login code",
    html,
  })
}
