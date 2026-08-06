import { NextRequest, NextResponse } from 'next/server'

const CODE = process.env.ACCESS_CODE

export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code?: string }

  if (!CODE) {
    // No gate configured — always allow
    const res = NextResponse.json({ ok: true })
    return res
  }

  if (!code || code.trim() !== CODE.trim()) {
    return NextResponse.json({ ok: false, error: 'Invalid access code' }, { status: 401 })
  }

  const redirectTo = req.nextUrl.searchParams.get('from') || '/'
  const res = NextResponse.json({ ok: true, redirectTo })
  res.cookies.set('gj_access', CODE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // 30-day session
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
