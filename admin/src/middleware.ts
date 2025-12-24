import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем публичные роуты
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  // Защищаем /admin/* роуты
  if (pathname.startsWith('/admin')) {
    try {
      const sessionCookie = request.cookies.get('vecta_session');
      
      if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Проверяем авторизацию и права platform admin
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
        headers: {
          Cookie: `vecta_session=${sessionCookie.value}`,
        },
      });

      const data = await response.json();

      if (!data.success || !data.data?.user?.isPlatformAdmin) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};


