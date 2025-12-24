import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createDealSchema, updateDealSchema, updateChecklistItemSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest, requireRole } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';
import { Decimal } from '@prisma/client/runtime/library';
import { createTasksFromTemplates } from '../lib/automation.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/deals
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const deals = await prisma.deal.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { deals },
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении сделок',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/deals/:id
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const deal = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
      include: {
        client: true,
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
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

    res.json({
      success: true,
      data: { deal },
    });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении сделки',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/deals/:id/timeline
router.get('/:id/timeline', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const dealId = req.params.id;

    // Проверяем, что сделка существует и принадлежит workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
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

    // Получаем ID связанных задач
    const tasks = await prisma.task.findMany({
      where: {
        relatedDealId: dealId,
        workspaceId: req.workspace.id,
      },
      select: { id: true },
    });
    const taskIds = tasks.map((t) => t.id);

    // Получаем события из AuditLog для сделки и связанных задач
    const events = await prisma.auditEvent.findMany({
      where: {
        workspaceId: req.workspace.id,
        OR: [
          { entityType: 'Deal', entityId: dealId },
          ...(taskIds.length > 0 ? [{ entityType: 'Task', entityId: { in: taskIds } }] : []),
        ],
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    res.json({
      success: true,
      data: { events },
    });
  } catch (error) {
    console.error('Get deal timeline error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении истории сделки',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/deals
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Валидация
    const validationResult = createDealSchema.safeParse(req.body);
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

    // Проверка существования клиента, если указан
    if (data.clientId && data.clientId !== '') {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
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

    const cleanData: any = {
      workspaceId: req.workspace.id,
      stage: data.stage,
      clientId: data.clientId && data.clientId !== '' ? data.clientId : null,
      assignedToUserId: data.assignedToUserId && data.assignedToUserId !== '' ? data.assignedToUserId : null,
      amount: data.amount ? new Decimal(data.amount) : null,
    };

    const deal = await prisma.deal.create({
      data: cleanData,
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Deal',
      entityId: deal.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ stage: deal.stage, amount: deal.amount?.toString() }),
    });

    // Автоматическое создание задач на основе шаблонов
    try {
      await createTasksFromTemplates(
        req.workspace.id,
        req.user.id,
        'DEAL_CREATED',
        null,
        deal.id,
        deal.clientId,
        deal.assignedToUserId
      );
    } catch (error) {
      // Не блокируем создание сделки, если автоматизация не сработала
      console.error('Error creating tasks from templates:', error);
    }

    res.status(201).json({
      success: true,
      data: { deal },
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании сделки',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/deals/:id
// RBAC: OWNER, ADMIN, MANAGER, AGENT могут обновлять сделки
// VIEWER не может обновлять
router.put('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER', 'AGENT'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование сделки
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEAL_NOT_FOUND',
          message: 'Сделка не найдена',
        },
      });
    }

    // Валидация
    const validationResult = updateDealSchema.safeParse(req.body);
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

    // Проверка существования клиента, если указан
    if (data.clientId && data.clientId !== '') {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
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

    const updateData: any = {};
    const stageChanged = data.stage !== undefined && data.stage !== existingDeal.stage;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.clientId !== undefined) {
      updateData.clientId = data.clientId && data.clientId !== '' ? data.clientId : null;
    }
    if (data.assignedToUserId !== undefined) {
      updateData.assignedToUserId = data.assignedToUserId && data.assignedToUserId !== '' ? data.assignedToUserId : null;
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount ? new Decimal(data.amount) : null;
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Deal',
      entityId: deal.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify(updateData),
    });

    // Автоматическое создание задач при смене стадии
    if (stageChanged && deal.stage) {
      try {
        await createTasksFromTemplates(
          req.workspace.id,
          req.user.id,
          'DEAL_STAGE_CHANGED',
          deal.stage,
          deal.id,
          deal.clientId,
          deal.assignedToUserId
        );
      } catch (error) {
        // Не блокируем обновление сделки, если автоматизация не сработала
        console.error('Error creating tasks from templates:', error);
      }
    }

    res.json({
      success: true,
      data: { deal },
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении сделки',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/deals/:id
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование сделки
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEAL_NOT_FOUND',
          message: 'Сделка не найдена',
        },
      });
    }

    await prisma.deal.delete({
      where: { id: req.params.id },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Deal',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ stage: existingDeal.stage }),
    });

    res.json({
      success: true,
      data: { message: 'Сделка удалена' },
    });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении сделки',
      },
    });
  }
});

// Чек-листы для этапов сделок
// Определяем чек-листы для каждого этапа
const STAGE_CHECKLISTS: Record<string, string[]> = {
  lead: ['Первичный контакт установлен', 'Потребность выявлена', 'Бюджет определен'],
  qualification: ['Квалификация пройдена', 'Решение принято', 'Сроки согласованы'],
  proposal: ['Коммерческое предложение отправлено', 'Презентация проведена', 'Вопросы клиента получены'],
  negotiation: ['Условия обсуждены', 'Скидка согласована', 'Договор подготовлен'],
  closed_won: ['Договор подписан', 'Оплата получена', 'Проект запущен'],
  closed_lost: ['Причина отказа выяснена', 'Обратная связь получена', 'Клиент в базе сохранен'],
};

// GET /workspaces/:workspaceSlug/deals/:id/checklist
router.get('/:id/checklist', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const dealId = req.params.id;

    // Проверяем, что сделка существует и принадлежит workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
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

    // Получаем существующие пункты чек-листа для текущего этапа
    const existingItems = await prisma.dealChecklistItem.findMany({
      where: {
        dealId: dealId,
        stage: deal.stage,
      },
      include: {
        completedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Если чек-лист для текущего этапа не создан, создаем его
    const checklistItems = STAGE_CHECKLISTS[deal.stage] || [];
    
    // Создаем недостающие пункты
    for (const title of checklistItems) {
      const exists = existingItems.some((item) => item.title === title);
      if (!exists) {
        await prisma.dealChecklistItem.create({
          data: {
            dealId: dealId,
            stage: deal.stage,
            title,
            completed: false,
          },
        });
      }
    }

    // Перезагружаем все пункты
    const allItems = await prisma.dealChecklistItem.findMany({
      where: {
        dealId: dealId,
        stage: deal.stage,
      },
      include: {
        completedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: { items: allItems },
    });
  } catch (error) {
    console.error('Get deal checklist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении чек-листа',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/deals/:id/checklist
// RBAC: MANAGER, AGENT могут отмечать пункты чек-листа
router.put('/:id/checklist', requireRole('OWNER', 'ADMIN', 'MANAGER', 'AGENT'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const dealId = req.params.id;

    // Проверяем, что сделка существует и принадлежит workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
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

    // Валидация
    const validationResult = updateChecklistItemSchema.safeParse(req.body);
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

    const { itemTitle, completed } = validationResult.data;

    // Находим или создаем пункт чек-листа
    let item = await prisma.dealChecklistItem.findUnique({
      where: {
        dealId_stage_title: {
          dealId: dealId,
          stage: deal.stage,
          title: itemTitle,
        },
      },
    });

    if (!item) {
      // Создаем новый пункт
      item = await prisma.dealChecklistItem.create({
        data: {
          dealId: dealId,
          stage: deal.stage,
          title: itemTitle,
          completed: completed,
          completedByUserId: completed ? req.user.id : null,
          completedAt: completed ? new Date() : null,
        },
      });
    } else {
      // Обновляем существующий пункт
      item = await prisma.dealChecklistItem.update({
        where: {
          id: item.id,
        },
        data: {
          completed: completed,
          completedByUserId: completed ? req.user.id : null,
          completedAt: completed ? new Date() : null,
        },
      });
    }

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'DEAL_CHECKLIST',
      entityId: dealId,
      action: completed ? 'CHECK' : 'UNCHECK',
      payloadJson: JSON.stringify({ stage: deal.stage, itemTitle }),
    });

    // Автозакрытие связанных задач при отметке пункта чек-листа
    if (completed) {
      try {
        // Ищем задачи, связанные с этой сделкой, которые могут быть закрыты
        const relatedTasks = await prisma.task.findMany({
          where: {
            relatedDealId: dealId,
            workspaceId: req.workspace.id,
            status: { in: ['TODO', 'IN_PROGRESS'] },
            // Ищем задачи, название которых похоже на пункт чек-листа
            OR: [
              { title: { contains: itemTitle, mode: 'insensitive' } },
              { description: { contains: itemTitle, mode: 'insensitive' } },
            ],
          },
        });

        // Закрываем найденные задачи
        for (const task of relatedTasks) {
          await prisma.task.update({
            where: { id: task.id },
            data: { status: 'DONE' },
          });

          await logAuditEvent({
            workspaceId: req.workspace.id,
            actorUserId: req.user.id,
            entityType: 'Task',
            entityId: task.id,
            action: 'UPDATE',
            payloadJson: JSON.stringify({
              status: 'DONE',
              autoClosed: true,
              checklistItem: itemTitle,
            }),
          });
        }
      } catch (error) {
        // Не блокируем обновление чек-листа, если автозакрытие не сработало
        console.error('Error auto-closing tasks:', error);
      }
    }

    // Проверяем, завершен ли весь чек-лист
    const allChecklistItems = await prisma.dealChecklistItem.findMany({
      where: {
        dealId: dealId,
        stage: deal.stage,
      },
    });

    const STAGE_CHECKLISTS: Record<string, string[]> = {
      lead: ['Первичный контакт установлен', 'Потребность выявлена', 'Бюджет определен'],
      qualification: ['Квалификация пройдена', 'Решение принято', 'Сроки согласованы'],
      proposal: ['Коммерческое предложение отправлено', 'Презентация проведена', 'Вопросы клиента получены'],
      negotiation: ['Условия обсуждены', 'Скидка согласована', 'Договор подготовлен'],
      closed_won: ['Договор подписан', 'Оплата получена', 'Проект запущен'],
      closed_lost: ['Причина отказа выяснена', 'Обратная связь получена', 'Клиент в базе сохранен'],
    };

    const requiredItems = STAGE_CHECKLISTS[deal.stage] || [];
    const completedItems = allChecklistItems.filter((i) => i.completed);
    const isChecklistComplete = requiredItems.length > 0 && completedItems.length === requiredItems.length;

    res.json({
      success: true,
      data: {
        item,
        checklistComplete: isChecklistComplete,
        completedCount: completedItems.length,
        totalCount: requiredItems.length,
      },
    });
  } catch (error) {
    console.error('Update deal checklist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении чек-листа',
      },
    });
  }
});

export default router;


