import { NextResponse } from 'next/server';

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch (err) {
    return true; // If we can't parse, treat as expired
  }
}

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // All paths are public for demo - auto-authentication enabled
  // Skip all middleware checks to allow direct access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
