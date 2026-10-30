import { NextRequest, NextResponse } from 'next/server'

// Proxy OAuth initiation to the backend and forward the 302 redirect.
// Frontend buttons link to /api/oauth/google or /api/oauth/linkedin.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params
  const backend = process.env.BACKEND_URL
  if (!backend) return NextResponse.json({ error: 'BACKEND_URL not set' }, { status: 500 })

  let upstream: Response
  try {
    upstream = await fetch(`${backend}/auth/${provider}`, { redirect: 'manual' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  const location = upstream.headers.get('location')
  if (!location || upstream.status < 300 || upstream.status >= 400) {
    return NextResponse.json({ error: 'OAuth init failed' }, { status: 500 })
  }

  const res = NextResponse.redirect(location, { status: upstream.status })

  // Forward the oauth_state cookie set by the backend
  const setCookies = upstream.headers.getSetCookie?.() ?? []
  for (const cookie of setCookies) {
    res.headers.append('Set-Cookie', cookie)
  }

  return res
}
