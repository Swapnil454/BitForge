import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Protect the marketplace from non-buyers (sellers/admins)
  if (token && request.nextUrl.pathname.startsWith('/marketplace')) {
    let role = 'buyer';
    try {
      const userCookie = request.cookies.get('user')?.value;
      if (userCookie) {
        const user = JSON.parse(decodeURIComponent(userCookie));
        role = user.role || 'buyer';
      }
    } catch (e) {}

    if (role !== 'buyer') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/marketplace/:path*'],
};
