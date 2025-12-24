import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function middleware(request: NextRequest) {
  // Защищаем только /app/* роуты
  if (request.nextUrl.pathname.startsWith('/app')) {
    const sessionCookie = request.cookies.get('vecta_session');

    if (!sessionCookie) {
      // Редирект на /login если нет сессии
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Проверяем валидность сессии через API
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Cookie: `vecta_session=${sessionCookie.value}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Сессия невалидна, редирект на /login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // Ошибка при проверке, редирект на /login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/app/:path*',
};


