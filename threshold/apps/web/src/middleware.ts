import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('threshold_token')?.value

  const isPublic = PUBLIC_PATHS.includes(pathname)
  const isAuthed = !!token

  if (!isAuthed && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthed && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
}
