import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) return NextResponse.json({ error: 'BACKEND_URL not set.' }, { status: 500 })
  const formData = await request.formData()
  const upstream = await fetch(`${backendUrl}/parse-resume/`, { method: 'POST', body: formData })
  const text = await upstream.text()
  if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
  return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
}
