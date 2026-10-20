import { NextRequest, NextResponse } from 'next/server'

const backend = () => {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error('BACKEND_URL not set')
  return url
}

// Proxy /api/digest/[...path] → FastAPI /digest/[...path]
// Forwards auth cookies so JWT-protected digest endpoints work from the browser.
async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const url = `${backend()}/digest/${path.join('/')}`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) headers['cookie'] = cookieHeader

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  let upstream: Response
  try {
    upstream = await fetch(url, { method: request.method, headers, body })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  const text = await upstream.text()
  const res = new NextResponse(text, { status: upstream.status })
  res.headers.set('Content-Type', 'application/json')

  const setCookies = upstream.headers.getSetCookie?.() ?? []
  for (const cookie of setCookies) {
    res.headers.append('Set-Cookie', cookie)
  }

  return res
}

export const GET = handler
export const POST = handler
