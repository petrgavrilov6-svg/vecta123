import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  createCampaignSchema,
  updateCampaignSchema,
} from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// ==================== TEMPLATES ====================

// GET /workspaces/:workspaceSlug/campaigns/templates
router.get('/templates', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const templates = await prisma.template.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении шаблонов',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/campaigns/templates
router.post('/templates', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = createTemplateSchema.safeParse(req.body);
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

    const template = await prisma.template.create({
      data: {
        workspaceId: req.workspace.id,
        name: data.name,
        subject: data.subject && data.subject !== '' ? data.subject : null,
        body: data.body,
        type: data.type,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Template',
      entityId: template.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ name: template.name, type: template.type }),
    });

    res.status(201).json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании шаблона',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/campaigns/templates/:id
router.put('/templates/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Шаблон не найден',
        },
      });
    }

    const validationResult = updateTemplateSchema.safeParse(req.body);
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
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subject !== undefined) {
      updateData.subject = data.subject && data.subject !== '' ? data.subject : null;
    }
    if (data.body !== undefined) updateData.body = data.body;
    if (data.type !== undefined) updateData.type = data.type;

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Template',
      entityId: template.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify(updateData),
    });

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении шаблона',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/campaigns/templates/:id
router.delete('/templates/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Шаблон не найден',
        },
      });
    }

    await prisma.template.delete({
      where: { id: req.params.id },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Template',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ name: existingTemplate.name }),
    });

    res.json({
      success: true,
      data: { message: 'Шаблон удалён' },
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении шаблона',
      },
    });
  }
});

// ==================== CAMPAIGNS ====================

// GET /workspaces/:workspaceSlug/campaigns
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            messageLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { campaigns },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении кампаний',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/campaigns/:id
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
      include: {
        template: true,
        messageLogs: {
          orderBy: {
            sentAt: 'desc',
          },
          take: 100,
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Кампания не найдена',
        },
      });
    }

    res.json({
      success: true,
      data: { campaign },
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении кампании',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/campaigns
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = createCampaignSchema.safeParse(req.body);
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

    // Проверка существования шаблона, если указан
    if (data.templateId && data.templateId !== '') {
      const template = await prisma.template.findFirst({
        where: {
          id: data.templateId,
          workspaceId: req.workspace.id,
        },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Шаблон не найден',
          },
        });
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: req.workspace.id,
        name: data.name,
        templateId: data.templateId && data.templateId !== '' ? data.templateId : null,
        status: data.status || 'DRAFT',
        scheduledAt: data.scheduledAt && data.scheduledAt !== '' ? new Date(data.scheduledAt) : null,
      },
    });

    // Мок отправка сообщений
    if (data.status === 'RUNNING' || !data.status) {
      await sendCampaignMessages(campaign.id, data.recipientEmails, req.workspace.id, req.user.id);
    }

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Campaign',
      entityId: campaign.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ name: campaign.name, recipients: data.recipientEmails.length }),
    });

    res.status(201).json({
      success: true,
      data: { campaign },
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании кампании',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/campaigns/:id
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Кампания не найдена',
        },
      });
    }

    const validationResult = updateCampaignSchema.safeParse(req.body);
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

    // Проверка существования шаблона, если указан
    if (data.templateId && data.templateId !== '') {
      const template = await prisma.template.findFirst({
        where: {
          id: data.templateId,
          workspaceId: req.workspace.id,
        },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Шаблон не найден',
          },
        });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.templateId !== undefined) {
      updateData.templateId = data.templateId && data.templateId !== '' ? data.templateId : null;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt && data.scheduledAt !== '' ? new Date(data.scheduledAt) : null;
    }

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Если статус изменён на RUNNING, отправляем сообщения
    if (data.status === 'RUNNING' && existingCampaign.status !== 'RUNNING' && data.recipientEmails) {
      await sendCampaignMessages(campaign.id, data.recipientEmails, req.workspace.id, req.user.id);
    }

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Campaign',
      entityId: campaign.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify(updateData),
    });

    res.json({
      success: true,
      data: { campaign },
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении кампании',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/campaigns/:id
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Кампания не найдена',
        },
      });
    }

    await prisma.campaign.delete({
      where: { id: req.params.id },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Campaign',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ name: existingCampaign.name }),
    });

    res.json({
      success: true,
      data: { message: 'Кампания удалена' },
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении кампании',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/campaigns/:id/send
router.post('/:id/send', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
      include: {
        template: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Кампания не найдена',
        },
      });
    }

    const { recipientEmails } = req.body;
    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Необходимо указать получателей',
        },
      });
    }

    await sendCampaignMessages(campaign.id, recipientEmails, req.workspace.id, req.user.id);

    // Обновляем статус кампании
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'RUNNING' },
    });

    res.json({
      success: true,
      data: { message: 'Кампания запущена, сообщения отправлены (мок)' },
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при отправке кампании',
      },
    });
  }
});

// Вспомогательная функция для мок отправки сообщений
async function sendCampaignMessages(
  campaignId: string,
  recipientEmails: string[],
  workspaceId: string,
  userId: string
) {
  for (const email of recipientEmails) {
    // Мок отправка - просто логируем
    console.log(`[MOCK] Отправка сообщения кампании ${campaignId} на ${email}`);

    // Создаём лог сообщения
    const status = Math.random() > 0.1 ? 'SENT' : 'FAILED'; // 90% успешных отправок
    const error = status === 'FAILED' ? 'Мок ошибка отправки' : null;

    await prisma.messageLog.create({
      data: {
        campaignId,
        recipient: email,
        status,
        error,
      },
    });
  }

  console.log(`[MOCK] Кампания ${campaignId} отправлена на ${recipientEmails.length} получателей`);
}

export default router;


