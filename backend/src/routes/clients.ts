import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createClientSchema, updateClientSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest, requireRole } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';
import { canPerformAction } from '../lib/rbac.js';

const router = Router({ mergeParams: true });

// Вспомогательные функции для CSV
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function generateCSV(clients: any[]): string {
  const headers = ['name', 'email', 'phone', 'notes', 'tags'];
  const rows = clients.map((client) => {
    return [
      client.name || '',
      client.email || '',
      client.phone || '',
      client.notes || '',
      client.tags || '',
    ]
      .map((val) => (val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val))
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/clients
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const clients = await prisma.client.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        deals: {
          select: {
            id: true,
            stage: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении клиентов',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/clients/:id
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
      include: {
        deals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
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

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении клиента',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/clients/:id/timeline
router.get('/:id/timeline', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const clientId = req.params.id;

    // Проверяем, что клиент существует и принадлежит workspace
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
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

    // Получаем ID связанных сделок и задач
    const deals = await prisma.deal.findMany({
      where: {
        clientId: clientId,
        workspaceId: req.workspace.id,
      },
      select: { id: true },
    });
    const dealIds = deals.map((d) => d.id);

    const tasks = await prisma.task.findMany({
      where: {
        relatedClientId: clientId,
        workspaceId: req.workspace.id,
      },
      select: { id: true },
    });
    const taskIds = tasks.map((t) => t.id);

    // Получаем события из AuditLog для клиента и связанных сущностей
    const events = await prisma.auditEvent.findMany({
      where: {
        workspaceId: req.workspace.id,
        OR: [
          { entityType: 'Client', entityId: clientId },
          ...(dealIds.length > 0 ? [{ entityType: 'Deal', entityId: { in: dealIds } }] : []),
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
    console.error('Get client timeline error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении истории клиента',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/clients
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Валидация
    const validationResult = createClientSchema.safeParse(req.body);
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
    
    // Очищаем пустые строки
    const cleanData: any = {
      workspaceId: req.workspace.id,
      name: data.name,
      assignedToUserId: data.assignedToUserId && data.assignedToUserId !== '' ? data.assignedToUserId : null,
      email: data.email && data.email !== '' ? data.email : null,
      phone: data.phone && data.phone !== '' ? data.phone : null,
      notes: data.notes && data.notes !== '' ? data.notes : null,
      tags: data.tags && data.tags !== '' ? data.tags : null,
    };

    const client = await prisma.client.create({
      data: cleanData,
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Client',
      entityId: client.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ name: client.name }),
    });

    res.status(201).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании клиента',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/clients/:id
// RBAC: OWNER, ADMIN, MANAGER, AGENT могут обновлять клиентов
// VIEWER не может обновлять
router.put('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER', 'AGENT'), async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование клиента
    const existingClient = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Клиент не найден',
        },
      });
    }

    // Валидация
    const validationResult = updateClientSchema.safeParse(req.body);
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
    
    // Очищаем пустые строки
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.assignedToUserId !== undefined) {
      updateData.assignedToUserId = data.assignedToUserId && data.assignedToUserId !== '' ? data.assignedToUserId : null;
    }
    if (data.email !== undefined) {
      updateData.email = data.email && data.email !== '' ? data.email : null;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone && data.phone !== '' ? data.phone : null;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes && data.notes !== '' ? data.notes : null;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags && data.tags !== '' ? data.tags : null;
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Client',
      entityId: client.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify(updateData),
    });

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении клиента',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/clients/:id
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование клиента
    const existingClient = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Клиент не найден',
        },
      });
    }

    await prisma.client.delete({
      where: { id: req.params.id },
    });

    // Audit log
    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Client',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ name: existingClient.name }),
    });

    res.json({
      success: true,
      data: { message: 'Клиент удалён' },
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении клиента',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/clients/export
router.get('/export', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const clients = await prisma.client.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const csv = generateCSV(clients);
    const filename = `clients_${req.workspace.slug}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM для корректного отображения кириллицы в Excel
  } catch (error) {
    console.error('Export clients error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при экспорте клиентов',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/clients/import
router.post('/import', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV текст обязателен',
        },
      });
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV файл пуст или некорректен',
        },
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 потому что первая строка - заголовки, и индексация с 0

      if (!row.name || row.name.trim() === '') {
        results.failed++;
        results.errors.push(`Строка ${rowNum}: отсутствует имя клиента`);
        continue;
      }

      try {
        // Валидация email если указан
        if (row.email && row.email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            results.failed++;
            results.errors.push(`Строка ${rowNum}: некорректный email "${row.email}"`);
            continue;
          }
        }

        const client = await prisma.client.create({
          data: {
            workspaceId: req.workspace.id,
            name: row.name.trim(),
            email: row.email && row.email.trim() !== '' ? row.email.trim() : null,
            phone: row.phone && row.phone.trim() !== '' ? row.phone.trim() : null,
            notes: row.notes && row.notes.trim() !== '' ? row.notes.trim() : null,
            tags: row.tags && row.tags.trim() !== '' ? row.tags.trim() : null,
          },
        });

        await logAuditEvent({
          workspaceId: req.workspace.id,
          actorUserId: req.user.id,
          entityType: 'Client',
          entityId: client.id,
          action: 'CREATE',
          payloadJson: JSON.stringify({ name: client.name, source: 'CSV_IMPORT' }),
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Строка ${rowNum}: ${error.message || 'Ошибка при создании клиента'}`);
      }
    }

    res.json({
      success: true,
      data: {
        imported: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Ограничиваем количество ошибок
      },
    });
  } catch (error) {
    console.error('Import clients error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при импорте клиентов',
      },
    });
  }
});

export default router;

