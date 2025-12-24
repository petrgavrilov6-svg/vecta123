import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createIntegrationSchema, updateIntegrationSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/integrations
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const integrations = await prisma.integration.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { integrations },
    });
  } catch (error) {
    console.error('List integrations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении списка интеграций',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/integrations/:id
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INTEGRATION_NOT_FOUND',
          message: 'Интеграция не найдена',
        },
      });
    }

    res.json({
      success: true,
      data: { integration },
    });
  } catch (error) {
    console.error('Get integration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении интеграции',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/integrations
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = createIntegrationSchema.safeParse(req.body);
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

    const integration = await prisma.integration.create({
      data: {
        workspaceId: req.workspace.id,
        type: data.type,
        status: data.status || 'INACTIVE',
        dataJson: data.dataJson || null,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Integration',
      entityId: integration.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ type: integration.type, status: integration.status }),
    });

    res.status(201).json({
      success: true,
      data: { integration },
    });
  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании интеграции',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/integrations/:id
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = updateIntegrationSchema.safeParse(req.body);
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

    // Проверяем существование интеграции
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingIntegration) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INTEGRATION_NOT_FOUND',
          message: 'Интеграция не найдена',
        },
      });
    }

    const data = validationResult.data;

    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        type: data.type,
        status: data.status,
        dataJson: data.dataJson !== undefined ? (data.dataJson || null) : undefined,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Integration',
      entityId: integration.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify({ type: integration.type, status: integration.status }),
    });

    res.json({
      success: true,
      data: { integration },
    });
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении интеграции',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/integrations/:id
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование интеграции
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingIntegration) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INTEGRATION_NOT_FOUND',
          message: 'Интеграция не найдена',
        },
      });
    }

    await prisma.integration.delete({
      where: { id: req.params.id },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Integration',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ type: existingIntegration.type }),
    });

    res.json({
      success: true,
      data: { message: 'Интеграция удалена' },
    });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении интеграции',
      },
    });
  }
});

export default router;


