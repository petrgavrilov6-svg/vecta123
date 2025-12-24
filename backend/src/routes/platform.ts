import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePlatformAdmin } from '../middleware/platformAdmin.js';
import { AuthRequest } from '../types.js';

const router = Router();

// Все роуты требуют авторизацию и права platform admin
router.use(requireAuth);
router.use(requirePlatformAdmin);

// GET /platform/users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isPlatformAdmin: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('List platform users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении списка пользователей',
      },
    });
  }
});

// GET /platform/workspaces
router.get('/workspaces', async (req: AuthRequest, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        _count: {
          select: {
            members: true,
            clients: true,
            deals: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { workspaces },
    });
  } catch (error) {
    console.error('List platform workspaces error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении списка workspace',
      },
    });
  }
});

// GET /platform/audit
router.get('/audit', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '100', offset = '0' } = req.query;

    const auditEvents = await prisma.auditEvent.findMany({
      include: {
        actor: {
          select: {
            id: true,
            email: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.auditEvent.count();

    res.json({
      success: true,
      data: {
        auditEvents,
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error('List platform audit error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении audit log',
      },
    });
  }
});

export default router;


