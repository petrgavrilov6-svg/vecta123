import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createChatRoomSchema, createMessageSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/chat/rooms
router.get('/rooms', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const rooms = await prisma.chatRoom.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            // В Prisma нет прямой связи с User через userId, поэтому просто получаем последнее сообщение
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { rooms },
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении комнат чата',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/chat/rooms
router.post('/rooms', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Валидация
    const validationResult = createChatRoomSchema.safeParse(req.body);
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

    const { name, type } = validationResult.data;

    const room = await prisma.chatRoom.create({
      data: {
        workspaceId: req.workspace.id,
        name,
        type,
      },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'ChatRoom',
      entityId: room.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ name, type }),
    });

    res.status(201).json({
      success: true,
      data: { room },
    });
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании комнаты чата',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    // Проверяем существование комнаты
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: req.params.roomId,
        workspaceId: req.workspace.id,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Комната чата не найдена',
        },
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: req.params.roomId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100, // Ограничиваем последними 100 сообщениями
    });

    res.json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении сообщений',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/chat/rooms/:roomId/messages
router.post('/rooms/:roomId/messages', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование комнаты
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: req.params.roomId,
        workspaceId: req.workspace.id,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Комната чата не найдена',
        },
      });
    }

    // Валидация
    const validationResult = createMessageSchema.safeParse(req.body);
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

    const { content } = validationResult.data;

    const message = await prisma.chatMessage.create({
      data: {
        roomId: req.params.roomId,
        userId: req.user.id,
        content,
      },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'ChatMessage',
      entityId: message.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ roomId: req.params.roomId }),
    });

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании сообщения',
      },
    });
  }
});

export default router;


