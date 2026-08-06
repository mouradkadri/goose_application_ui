import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// If ACCESS_CODE is not set, the app is open (local dev / no gate needed)
const CODE = process.env.ACCESS_CODE

const COOKIE = 'gj_access'

// Paths that are always public
const PUBLIC_PREFIXES = [
  '/enter',
  '/api/auth',
  '/_next',
  '/favicon',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If no access code is configured, pass through everything
  if (!CODE) return NextResponse.next()

  // Always allow public paths (entry page, auth API, Next.js internals, static files)
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static file extensions
  if (/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|woff|woff2|ttf)$/.test(pathname)) {
    return NextResponse.next()
  }

  // Check auth cookie
  const cookie = request.cookies.get(COOKIE)?.value
  if (cookie === CODE) {
    return NextResponse.next()
  }

  // Redirect to entry page
  const entryUrl = new URL('/enter', request.url)
  entryUrl.searchParams.set('from', pathname === '/enter' ? '/' : pathname)
  return NextResponse.redirect(entryUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
