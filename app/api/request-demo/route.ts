import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  let name: string, email: string, message: string
  try {
    const body = await req.json() as { name?: string; email?: string; message?: string }
    name = (body.name || '').trim()
    email = (body.email || '').trim()
    message = (body.message || '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  if (!name || !email) {
    return NextResponse.json({ ok: false, error: 'Name and email are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email address.' }, { status: 400 })
  }

  const smtpUser = process.env.DEMO_SMTP_USER
  const smtpPass = process.env.DEMO_SMTP_PASS
  const notifyEmail = process.env.DEMO_NOTIFY_EMAIL || 'kadriemna97@gmail.com'

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.DEMO_SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.DEMO_SMTP_PORT || 587),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      })
      await transporter.sendMail({
        from: `"GooseJobs" <${smtpUser}>`,
        to: notifyEmail,
        subject: `GooseJobs demo request — ${name} <${email}>`,
        text: [
          `New demo access request`,
          ``,
          `Name:    ${name}`,
          `Email:   ${email}`,
          `Message: ${message || '(none)'}`,
          ``,
          `To approve: reply to this email with the access code.`,
          `They will use it at https://goosejobs.app/enter`,
        ].join('\n'),
        html: `
          <p style="font-family:sans-serif;font-size:15px;color:#1a1510">
            <strong>New demo access request</strong>
          </p>
          <table style="font-family:sans-serif;font-size:14px;color:#3d2e1e;border-collapse:collapse">
            <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${name}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td>${email}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:600">Message</td><td>${message || '(none)'}</td></tr>
          </table>
          <p style="font-family:sans-serif;font-size:13px;color:#7a6347;margin-top:16px">
            Reply to this email with the access code — they'll use it at <code>/enter</code>.
          </p>
        `,
      })
    } catch (err) {
      console.error('[request-demo] email send failed:', err)
    }
  } else {
    // SMTP not configured — log the request so the owner can see it in server logs
    console.info('[demo-request]', JSON.stringify({ name, email, message, ts: new Date().toISOString() }))
  }

  return NextResponse.json({ ok: true })
}
