import { NextRequest } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    return new Response('BACKEND_URL not set', { status: 500 })
  }

  // Forward the entire form as-is (includes resume_file + any location fields
  // the client appended: location, country_code, is_remote)
  const formData = await request.formData()

  let upstream: Response
  try {
    upstream = await fetch(`${backendUrl}/find-jobs/stream/`, {
      method: 'POST',
      headers: hfAuthHeaders(),
      body: formData,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Backend unreachable'
    return new Response(`data: {"type":"error","msg":"${msg}"}\n\n`, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(
      `data: {"type":"error","msg":"${text.slice(0, 200)}"}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
