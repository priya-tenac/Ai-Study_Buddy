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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🤖 AI Study Buddy</h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Your AI-powered study companion</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Your Login Code</h2>
                  <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">Use the one-time code below to finish signing in.<br/>It works for a short time and can only be used once.</p>
                  
                  <!-- OTP Code Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px 48px; border-radius: 12px; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">
                          <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 0.3em; color: #ffffff; font-family: 'Courier New', monospace;">${otp}</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Security Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin: 0 0 20px 0;">
                    <tr>
                      <td style="padding: 16px; text-align: left;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">🔒 <strong>Security tip:</strong> Never share this code with anyone. AI Study Buddy will never ask for your code via email or phone.</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">If you didn't try to sign in, you can safely ignore this email.</p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">This is an automated security email.</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 AI Study Buddy. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await transporter.sendMail({
    from,
    to,
    subject: "Your AI Study Buddy login code",
    html,
  })
}
