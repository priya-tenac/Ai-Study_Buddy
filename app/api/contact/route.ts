import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    console.log('Attempting to send email...');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const recipient = process.env.CONTACT_RECEIVER || process.env.SMTP_USER;
    
    // Send email to admin
    console.log('Sending to admin:', recipient);
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipient,
      subject: `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      replyTo: email,
    });
    console.log('Admin email sent successfully');

    // Send confirmation email to user
    console.log('Sending confirmation to user:', email);
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Thank you for contacting AI Study Buddy',
      html: `
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
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #6366f1; font-size: 24px; font-weight: 600;">Thank you for reaching out!</h2>
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
                      <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">We've received your message and our team will get back to you as soon as possible. We typically respond within 24 hours.</p>
                      
                      <!-- Message Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #6366f1; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Message:</p>
                            <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; line-height: 1.6;">In the meantime, feel free to explore our features:</p>
                      
                      <!-- Feature Links -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 10px 0;">
                            <a href="https://nextjs-ai-buddy-dbbw.vercel.app/summarize" style="color: #6366f1; text-decoration: none; font-size: 15px; display: inline-flex; align-items: center;">📝 Smart Notes & Summaries →</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <a href="https://nextjs-ai-buddy-dbbw.vercel.app/exam-predictor" style="color: #6366f1; text-decoration: none; font-size: 15px; display: inline-flex; align-items: center;">🎯 AI Exam Predictor →</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <a href="https://nextjs-ai-buddy-dbbw.vercel.app/quiz-battle" style="color: #6366f1; text-decoration: none; font-size: 15px; display: inline-flex; align-items: center;">⚔️ AI Quiz Battle →</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">Best regards,<br/><strong style="color: #6366f1;">AI Study Buddy Team</strong></p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">This is an automated confirmation email.</p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2026 AI Study Buddy. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log('User confirmation email sent successfully');

    return NextResponse.json({ success: true, recipient });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
