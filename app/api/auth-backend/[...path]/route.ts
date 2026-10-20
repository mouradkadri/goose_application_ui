import { NextRequest, NextResponse } from 'next/server'

const backend = () => {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error('BACKEND_URL not set')
  return url
}

// Proxy /api/auth-backend/[...path] → FastAPI /auth/[...path]
// Forwards auth cookies back to the browser via Set-Cookie.
async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const backendPath = path.join('/')
  const url = `${backend()}/auth/${backendPath}`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  // Forward existing auth cookies to the backend (for /refresh, /logout, /me)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) headers['cookie'] = cookieHeader

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  const text = await upstream.text()
  const res = new NextResponse(text, { status: upstream.status })
  res.headers.set('Content-Type', 'application/json')

  // Relay Set-Cookie headers so JWT cookies land in the browser
  const setCookies = upstream.headers.getSetCookie?.() ?? []
  for (const cookie of setCookies) {
    res.headers.append('Set-Cookie', cookie)
  }

  return res
}

export const GET = handler
export const POST = handler
export const DELETE = handler
