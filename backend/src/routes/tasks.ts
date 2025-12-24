import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createTaskSchema, updateTaskSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/tasks
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        deal: {
          select: {
            id: true,
            stage: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении задач',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/tasks/:id
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
      include: {
        client: true,
        deal: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Задача не найдена',
        },
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении задачи',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/tasks
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Валидация
    const validationResult = createTaskSchema.safeParse(req.body);
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

    const data = validationResult.data;

    // Проверка существования связанных сущностей
    if (data.relatedClientId && data.relatedClientId !== '') {
      const client = await prisma.client.findFirst({
        where: {
          id: data.relatedClientId,
          workspaceId: req.workspace.id,
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: 'Клиент не найден',
          },
        });
      }
    }

    if (data.relatedDealId && data.relatedDealId !== '') {
      const deal = await prisma.deal.findFirst({
        where: {
          id: data.relatedDealId,
          workspaceId: req.workspace.id,
        },
      });

      if (!deal) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DEAL_NOT_FOUND',
            message: 'Сделка не найдена',
          },
        });
      }
    }

    const cleanData: any = {
      workspaceId: req.workspace.id,
      title: data.title,
      description: data.description && data.description !== '' ? data.description : null,
      dueAt: data.dueAt && data.dueAt !== '' ? new Date(data.dueAt) : null,
      status: data.status,
      assignedToUserId: data.assignedToUserId && data.assignedToUserId !== '' ? data.assignedToUserId : null,
      relatedClientId: data.relatedClientId && data.relatedClientId !== '' ? data.relatedClientId : null,
      relatedDealId: data.relatedDealId && data.relatedDealId !== '' ? data.relatedDealId : null,
    };

    const task = await prisma.task.create({
      data: cleanData,
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Task',
      entityId: task.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ title: task.title, status: task.status }),
    });

    res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании задачи',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/tasks/:id
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование задачи
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Задача не найдена',
        },
      });
    }

    // Валидация
    const validationResult = updateTaskSchema.safeParse(req.body);
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

    const data = validationResult.data;

    // Проверка существования связанных сущностей
    if (data.relatedClientId && data.relatedClientId !== '') {
      const client = await prisma.client.findFirst({
        where: {
          id: data.relatedClientId,
          workspaceId: req.workspace.id,
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: 'Клиент не найден',
          },
        });
      }
    }

    if (data.relatedDealId && data.relatedDealId !== '') {
      const deal = await prisma.deal.findFirst({
        where: {
          id: data.relatedDealId,
          workspaceId: req.workspace.id,
        },
      });

      if (!deal) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DEAL_NOT_FOUND',
            message: 'Сделка не найдена',
          },
        });
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) {
      updateData.description = data.description && data.description !== '' ? data.description : null;
    }
    if (data.dueAt !== undefined) {
      updateData.dueAt = data.dueAt && data.dueAt !== '' ? new Date(data.dueAt) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedToUserId !== undefined) {
      updateData.assignedToUserId = data.assignedToUserId && data.assignedToUserId !== '' ? data.assignedToUserId : null;
    }
    if (data.relatedClientId !== undefined) {
      updateData.relatedClientId = data.relatedClientId && data.relatedClientId !== '' ? data.relatedClientId : null;
    }
    if (data.relatedDealId !== undefined) {
      updateData.relatedDealId = data.relatedDealId && data.relatedDealId !== '' ? data.relatedDealId : null;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Task',
      entityId: task.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify(updateData),
    });

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении задачи',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/tasks/:id
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование задачи
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Задача не найдена',
        },
      });
    }

    await prisma.task.delete({
      where: { id: req.params.id },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Task',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ title: existingTask.title }),
    });

    res.json({
      success: true,
      data: { message: 'Задача удалена' },
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении задачи',
      },
    });
  }
});

export default router;


