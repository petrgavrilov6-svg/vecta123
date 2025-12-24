import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { createPaymentSchema, updatePaymentSchema, createInvoiceSchema, updateInvoiceSchema } from '../lib/validation.js';
import { requireWorkspaceMember, WorkspaceRequest } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/audit.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// ==================== INVOICES ====================

// GET /workspaces/:workspaceSlug/payments/invoices
router.get('/invoices', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { invoices },
    });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении списка счетов',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/payments/invoices/:id
router.get('/invoices/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Счёт не найден',
        },
      });
    }

    res.json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении счёта',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/payments/invoices
router.post('/invoices', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = createInvoiceSchema.safeParse(req.body);
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

    // Проверяем уникальность номера счёта
    const existingInvoice = await prisma.invoice.findUnique({
      where: { number: data.number },
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVOICE_NUMBER_EXISTS',
          message: 'Счёт с таким номером уже существует',
        },
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: req.workspace.id,
        number: data.number,
        amount: data.amount,
        status: data.status || 'DRAFT',
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ number: invoice.number, amount: invoice.amount.toString() }),
    });

    res.status(201).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании счёта',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/payments/invoices/:id
router.put('/invoices/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = updateInvoiceSchema.safeParse(req.body);
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

    // Проверяем существование счёта
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Счёт не найден',
        },
      });
    }

    const data = validationResult.data;

    // Если обновляется номер, проверяем уникальность
    if (data.number && data.number !== existingInvoice.number) {
      const duplicateInvoice = await prisma.invoice.findUnique({
        where: { number: data.number },
      });

      if (duplicateInvoice) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVOICE_NUMBER_EXISTS',
            message: 'Счёт с таким номером уже существует',
          },
        });
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        number: data.number,
        amount: data.amount,
        status: data.status,
        dueAt: data.dueAt ? new Date(data.dueAt) : data.dueAt === '' ? null : undefined,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify({ number: invoice.number, amount: invoice.amount.toString() }),
    });

    res.json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении счёта',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/payments/invoices/:id
router.delete('/invoices/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование счёта
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        workspaceId: req.workspace.id,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Счёт не найден',
        },
      });
    }

    await prisma.invoice.delete({
      where: { id: req.params.id },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Invoice',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ number: existingInvoice.number }),
    });

    res.json({
      success: true,
      data: { message: 'Счёт удалён' },
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении счёта',
      },
    });
  }
});

// ==================== PAYMENTS ====================

// GET /workspaces/:workspaceSlug/payments
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    // Получаем все счета workspace и их платежи
    const invoices = await prisma.invoice.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        payments: true,
      },
    });

    const payments = invoices.flatMap((invoice: { payments: any[] }) => invoice.payments);

    res.json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении списка платежей',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/payments/:id
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace не найден' },
      });
    }

    // Находим платеж через invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        workspaceId: req.workspace.id,
        payments: {
          some: {
            id: req.params.id,
          },
        },
      },
      include: {
        payments: {
          where: {
            id: req.params.id,
          },
        },
      },
    });

    if (!invoice || invoice.payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Платеж не найден',
        },
      });
    }

    res.json({
      success: true,
      data: { payment: invoice.payments[0] },
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении платежа',
      },
    });
  }
});

// POST /workspaces/:workspaceSlug/payments
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = createPaymentSchema.safeParse(req.body);
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

    // Проверяем существование счёта и что он принадлежит workspace
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: data.invoiceId,
        workspaceId: req.workspace.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Счёт не найден',
        },
      });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        status: data.status || 'PENDING',
        externalId: data.externalId && data.externalId.trim() !== '' ? data.externalId : null,
        metadataJson: data.metadataJson && data.metadataJson.trim() !== '' ? data.metadataJson : null,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Payment',
      entityId: payment.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({ invoiceId: payment.invoiceId, amount: payment.amount.toString(), method: payment.method }),
    });

    res.status(201).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при создании платежа',
      },
    });
  }
});

// PUT /workspaces/:workspaceSlug/payments/:id
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const validationResult = updatePaymentSchema.safeParse(req.body);
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

    // Проверяем существование платежа через invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        workspaceId: req.workspace.id,
        payments: {
          some: {
            id: req.params.id,
          },
        },
      },
      include: {
        payments: {
          where: {
            id: req.params.id,
          },
        },
      },
    });

    if (!invoice || invoice.payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Платеж не найден',
        },
      });
    }

    const data = validationResult.data;

    // Если обновляется invoiceId, проверяем что новый счёт принадлежит workspace
    if (data.invoiceId && data.invoiceId !== invoice.id) {
      const newInvoice = await prisma.invoice.findFirst({
        where: {
          id: data.invoiceId,
          workspaceId: req.workspace.id,
        },
      });

      if (!newInvoice) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: 'Счёт не найден',
          },
        });
      }
    }

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        status: data.status,
        externalId: data.externalId !== undefined ? (data.externalId && data.externalId.trim() !== '' ? data.externalId : null) : undefined,
        metadataJson: data.metadataJson !== undefined ? (data.metadataJson && data.metadataJson.trim() !== '' ? data.metadataJson : null) : undefined,
      },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Payment',
      entityId: payment.id,
      action: 'UPDATE',
      payloadJson: JSON.stringify({ amount: payment.amount.toString(), method: payment.method, status: payment.status }),
    });

    res.json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при обновлении платежа',
      },
    });
  }
});

// DELETE /workspaces/:workspaceSlug/payments/:id
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    // Проверяем существование платежа через invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        workspaceId: req.workspace.id,
        payments: {
          some: {
            id: req.params.id,
          },
        },
      },
      include: {
        payments: {
          where: {
            id: req.params.id,
          },
        },
      },
    });

    if (!invoice || invoice.payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Платеж не найден',
        },
      });
    }

    const existingPayment = invoice.payments[0];

    await prisma.payment.delete({
      where: { id: req.params.id },
    });

    await logAuditEvent({
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      entityType: 'Payment',
      entityId: req.params.id,
      action: 'DELETE',
      payloadJson: JSON.stringify({ amount: existingPayment.amount.toString(), method: existingPayment.method }),
    });

    res.json({
      success: true,
      data: { message: 'Платеж удалён' },
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при удалении платежа',
      },
    });
  }
});

export default router;

