import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CODE = process.env.ACCESS_CODE

// Always allow these paths without any auth check
const PUBLIC_PREFIXES = [
  '/',          // landing page (exact match handled below)
  '/enter',
  '/login',
  '/register',
  '/demo',
  '/onboarding',
  '/api/',
  '/_next',
  '/favicon',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exact landing page — always public
  if (pathname === '/') return NextResponse.next()

  // Static file extensions — always public
  if (/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|woff|woff2|ttf)$/.test(pathname)) {
    return NextResponse.next()
  }

  // Public path prefixes — always pass through
  if (PUBLIC_PREFIXES.some(p => p !== '/' && pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  // Accept either a JWT cookie (Phase 3 accounts) or the legacy access-code cookie.

  const hasJwt = request.cookies.has('gj_token')
  if (hasJwt) return NextResponse.next()

  const accessCookie = request.cookies.get('gj_access')?.value
  if (CODE && accessCookie === CODE) return NextResponse.next()

  // No CODE configured and no JWT → open (local dev with no gate)
  if (!CODE) return NextResponse.next()

  // Not authenticated → redirect to /enter
  const entryUrl = new URL('/enter', request.url)
  entryUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(entryUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
