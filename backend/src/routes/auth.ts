import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { registerSchema, loginSchema } from '../lib/validation.js';
import { requireAuth, generateSessionToken } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';

const router = Router();

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'vecta_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';
const SESSION_DURATION_DAYS = 30;

// POST /auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    // Валидация
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: validationResult.error.errors,
        },
      });
    }

    const { email, password } = validationResult.data;

    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Пользователь с таким email уже существует',
        },
      });
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isPlatformAdmin: false,
      },
      select: {
        id: true,
        email: true,
        isPlatformAdmin: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'Пользователь успешно зарегистрирован',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при регистрации',
      },
    });
  }
});

// POST /auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    // Валидация
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: validationResult.error.errors,
        },
      });
    }

    const { email, password } = validationResult.data;

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Неверный email или пароль',
        },
      });
    }

    // Проверка пароля
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Неверный email или пароль',
        },
      });
    }

    // Создание сессии
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // Установка cookie
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          isPlatformAdmin: user.isPlatformAdmin,
          createdAt: user.createdAt,
        },
        message: 'Успешный вход',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при входе',
      },
    });
  }
});

// POST /auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.sessionId) {
      await prisma.session.delete({
        where: { id: req.sessionId },
      });
    }

    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({
      success: true,
      data: {
        message: 'Успешный выход',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при выходе',
      },
    });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Пользователь не найден',
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          isPlatformAdmin: req.user.isPlatformAdmin,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении данных пользователя',
      },
    });
  }
});

export default router;


