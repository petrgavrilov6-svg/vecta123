import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types.js';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'vecta_session';

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Сессия не найдена',
        },
      });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Сессия недействительна',
        },
      });
    }

    if (session.expiresAt < new Date()) {
      // Удаляем истекшую сессию
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Сессия истекла',
        },
      });
    }

    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка проверки авторизации',
      },
    });
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}


