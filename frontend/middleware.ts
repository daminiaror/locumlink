import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/', '/home', '/login', '/signup', '/register', '/auth'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always let public routes, Next internals, and API through
  if (
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // JWT is stored in localStorage (client-only), mirrored to `ll_access` cookie
  // by src/lib/auth.ts → saveToken(). Middleware reads the cookie.
  const token = req.cookies.get('ll_access')?.value;
  const role  = req.cookies.get('ll_role')?.value;   // 'clinic' | 'locum'

  if (!token) {
    const url = new URL('/home', req.url);
    // Preserve the intended destination so we can redirect back after login
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Enforce role boundaries so a locum can't access /host/* and vice-versa
  if (pathname.startsWith('/host') && role === 'locum') {
    return NextResponse.redirect(new URL('/locum/dashboard', req.url));
  }
  if (pathname.startsWith('/locum') && role === 'clinic') {
    return NextResponse.redirect(new URL('/host/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/host/:path*', '/locum/:path*', '/dashboard/:path*'],
};
