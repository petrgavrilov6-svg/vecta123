import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createInviteSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest, requireRole } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';
import crypto from 'crypto';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/members/me
// Получение текущего пользователя и его роли в workspace
router.get('/me', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user || !req.member) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    res.json({
      success: true,
      data: {
        member: {
          id: req.member.id,
          role: req.member.role,
        },
      },
    });
  } catch (error) {
    console.error('Get current member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении данных пользователя',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/members
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const members = await prisma.member.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении членов workspace',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/invites
router.get('/invites', requireRole('OWNER', 'ADMIN'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const invites = await prisma.invite.findMany({
      where: {
        workspaceId: req.workspace.id,
        acceptedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { invites },
    });
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении приглашений',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/invites
router.post('/invites', requireRole('OWNER', 'ADMIN'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Валидация
    const validationResult = createInviteSchema.safeParse(req.body);
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

    const { email, role } = validationResult.data;

    // Проверяем, не является ли пользователь уже членом
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            workspaceId: req.workspace.id,
          },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_MEMBER',
          message: 'Пользователь уже является членом этого workspace',
        },
      });
    }

    // Проверяем, нет ли активного приглашения
    const existingInvite = await prisma.invite.findFirst({
      where: {
        workspaceId: req.workspace.id,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'INVITE_EXISTS',
          message: 'Активное приглашение уже существует',
        },
      });
    }

    // Создаём приглашение
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    const invite = await prisma.invite.create({
      data: {
        workspaceId: req.workspace.id,
        email,
        role,
        token,
        expiresAt,
      },
    });

    // Мок отправка приглашения (в реальном приложении здесь была бы отправка email)
    console.log(`[MOCK] Приглашение отправлено на ${email}`);
    console.log(`[MOCK] Ссылка для принятия: http://localhost:3000/invite/${token}`);
    console.log(`[MOCK] Workspace: ${req.workspace.name}, Роль: ${role}`);

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Invite',
      entityId: invite.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ email, role }),
    });

    res.status(201).json({
      success: true,
      data: {
        invite,
        message: 'Приглашение создано (мок отправка в консоль)',
      },
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании приглашения',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/members/:memberId
router.delete('/:memberId', requireRole('OWNER', 'ADMIN'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const memberId = req.params.memberId;

    // Проверяем существование члена
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        workspaceId: req.workspace.id,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Член workspace не найден',
        },
      });
    }

    // Нельзя удалить самого себя
    if (member.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_REMOVE_SELF',
          message: 'Нельзя удалить самого себя из workspace',
        },
      });
    }

    // Нельзя удалить OWNER (только если это не последний OWNER)
    if (member.role === 'OWNER') {
      const ownerCount = await prisma.member.count({
        where: {
          workspaceId: req.workspace.id,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_LAST_OWNER',
            message: 'Нельзя удалить последнего OWNER workspace',
          },
        });
      }
    }

    await prisma.member.delete({
      where: { id: memberId },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Member',
      entityId: memberId,
      action: 'DELETE',
      payloadJson: JSON.stringify({ email: member.user.email, role: member.role }),
    });

    res.json({
      success: true,
      data: { message: 'Член workspace удалён' },
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении члена workspace',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/invites/:inviteId
router.delete('/invites/:inviteId', requireRole('OWNER', 'ADMIN'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const invite = await prisma.invite.findFirst({
      where: {
        id: req.params.inviteId,
        workspaceId: req.workspace.id,
      },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVITE_NOT_FOUND',
          message: 'Приглашение не найдено',
        },
      });
    }

    await prisma.invite.delete({
      where: { id: req.params.inviteId },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Invite',
      entityId: req.params.inviteId,
      action: 'DELETE',
      payloadJson: JSON.stringify({ email: invite.email }),
    });

    res.json({
      success: true,
      data: { message: 'Приглашение удалено' },
    });
  } catch (error) {
    console.error('Delete invite error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении приглашения',
      },
    });
  }
});

export default router;


