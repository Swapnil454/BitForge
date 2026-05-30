import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // If user is authenticated and trying to access the landing page (/)
  if (token && request.nextUrl.pathname === '/') {
    // Check if we have user role cookie to route intelligently
    let role = 'buyer';
    try {
      const userCookie = request.cookies.get('user')?.value;
      if (userCookie) {
        const user = JSON.parse(decodeURIComponent(userCookie));
        role = user.role || 'buyer';
      }
    } catch (e) {
      // default to buyer if parsing fails
    }

    const targetPath = role === 'buyer' ? '/marketplace' : `/dashboard/${role}`;
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

// Only run middleware on the root path
export const config = {
  matcher: ['/'],
};
