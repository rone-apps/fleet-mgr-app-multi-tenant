import { NextResponse } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/signin', '/signup', '/forgot-password'];

/**
 * Check if JWT token is expired by decoding the payload
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

  // Allow public paths without auth
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow the landing page (root /) without auth
  if (path === '/') {
    return NextResponse.next();
  }

  // Check for token in cookies
  const token = request.cookies.get('token')?.value;

  if (!token || isTokenExpired(token)) {
    // Clear the expired cookie and redirect to signin
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', path);
    const response = NextResponse.redirect(signinUrl);
    response.cookies.delete('token');
    return response;
  }

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
