/**
 * Dashboard API endpoints
 * 
 * Предоставляет данные для dashboard: статистика, аналитика, "требует внимания"
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireWorkspaceMember, WorkspaceRequest } from '../middleware/workspace.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Все роуты требуют авторизацию и membership в workspace
router.use(requireAuth);
router.use(requireWorkspaceMember);

// GET /workspaces/:workspaceSlug/dashboard/attention
// Блок "Требует внимания": просроченные задачи, сделки без задач
router.get('/attention', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const now = new Date();

    // Просроченные задачи
    const overdueTasks = await prisma.task.findMany({
      where: {
        workspaceId: req.workspace.id,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueAt: { lt: now },
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
      orderBy: {
        dueAt: 'asc',
      },
      take: 10,
    });

    // Сделки без задач (активные сделки, у которых нет связанных задач)
    const activeDeals = await prisma.deal.findMany({
      where: {
        workspaceId: req.workspace.id,
        stage: { notIn: ['closed_won', 'closed_lost'] },
      },
      include: {
        tasks: {
          select: {
            id: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const dealsWithoutTasks = activeDeals
      .filter((deal) => deal.tasks.length === 0)
      .slice(0, 10)
      .map((deal) => ({
        id: deal.id,
        stage: deal.stage,
        client: deal.client,
      }));

    res.json({
      success: true,
      data: {
        overdueTasks,
        dealsWithoutTasks,
      },
    });
  } catch (error) {
    console.error('Get attention items error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении данных "Требует внимания"',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/dashboard/analytics/deals
// Аналитика по сделкам: количество по стадиям, суммы, закрытые/проигранные
router.get('/analytics/deals', async (req: WorkspaceRequest, res: Response) => {
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
      select: {
        stage: true,
        amount: true,
      },
    });

    // Группировка по стадиям
    const byStage: Record<string, { count: number; totalAmount: number }> = {};
    let totalAmount = 0;
    let closedWonCount = 0;
    let closedLostCount = 0;
    let closedWonAmount = 0;

    for (const deal of deals) {
      if (!byStage[deal.stage]) {
        byStage[deal.stage] = { count: 0, totalAmount: 0 };
      }
      byStage[deal.stage].count++;
      
      const amount = deal.amount ? parseFloat(String(deal.amount)) : 0;
      byStage[deal.stage].totalAmount += amount;
      totalAmount += amount;

      if (deal.stage === 'closed_won') {
        closedWonCount++;
        closedWonAmount += amount;
      } else if (deal.stage === 'closed_lost') {
        closedLostCount++;
      }
    }

    // Средняя сумма сделки
    const avgAmount = deals.length > 0 ? totalAmount / deals.length : 0;

    res.json({
      success: true,
      data: {
        byStage,
        totalCount: deals.length,
        totalAmount,
        avgAmount,
        closedWonCount,
        closedLostCount,
        closedWonAmount,
      },
    });
  } catch (error) {
    console.error('Get deals analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении аналитики по сделкам',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/dashboard/analytics/tasks
// Аналитика по задачам: по статусам, просроченные, по пользователям
router.get('/analytics/tasks', async (req: WorkspaceRequest, res: Response) => {
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
      select: {
        status: true,
        dueAt: true,
        assignedToUserId: true,
      },
    });

    const now = new Date();

    // Группировка по статусам
    const byStatus: Record<string, number> = {};
    let overdueCount = 0;
    const byUser: Record<string, { total: number; overdue: number; done: number }> = {};

    for (const task of tasks) {
      // По статусам
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;

      // Просроченные
      if (task.dueAt && new Date(task.dueAt) < now && task.status !== 'DONE' && task.status !== 'CANCELLED') {
        overdueCount++;
      }

      // По пользователям
      const userId = task.assignedToUserId || 'unassigned';
      if (!byUser[userId]) {
        byUser[userId] = { total: 0, overdue: 0, done: 0 };
      }
      byUser[userId].total++;
      if (task.status === 'DONE') {
        byUser[userId].done++;
      }
      if (task.dueAt && new Date(task.dueAt) < now && task.status !== 'DONE' && task.status !== 'CANCELLED') {
        byUser[userId].overdue++;
      }
    }

    res.json({
      success: true,
      data: {
        byStatus,
        overdueCount,
        byUser,
        totalCount: tasks.length,
      },
    });
  } catch (error) {
    console.error('Get tasks analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении аналитики по задачам',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/dashboard/my
// Личная панель пользователя: мои задачи, мои сделки, что просрочено, что требует внимания
router.get('/my', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.user) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или пользователь не найден' },
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Мои задачи
    const myTasks = await prisma.task.findMany({
      where: {
        workspaceId: req.workspace.id,
        assignedToUserId: req.user.id,
        status: { not: 'DONE' },
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
      orderBy: {
        dueAt: 'asc',
      },
    });

    // Мои сделки (активные)
    const myDeals = await prisma.deal.findMany({
      where: {
        workspaceId: req.workspace.id,
        assignedToUserId: req.user.id,
        stage: { notIn: ['closed_won', 'closed_lost'] },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Просроченные задачи
    const overdueTasks = myTasks.filter(
      (task) => task.dueAt && new Date(task.dueAt) < now && task.status !== 'DONE' && task.status !== 'CANCELLED'
    );

    // Что требует внимания сегодня (задачи с дедлайном сегодня)
    const todayTasks = myTasks.filter(
      (task) => task.dueAt && new Date(task.dueAt) >= todayStart && new Date(task.dueAt) < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    );

    res.json({
      success: true,
      data: {
        myTasks: myTasks.length,
        myDeals: myDeals.length,
        overdueTasks: overdueTasks.length,
        todayTasks: todayTasks.length,
        overdueTasksList: overdueTasks.slice(0, 10),
        todayTasksList: todayTasks.slice(0, 10),
        myDealsList: myDeals.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Get my dashboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении личной панели',
      },
    });
  }
});

// GET /workspaces/:workspaceSlug/dashboard/team
// Обзор по команде (для OWNER / ADMIN / MANAGER)
router.get('/team', async (req: WorkspaceRequest, res: Response) => {
  try {
    if (!req.workspace || !req.member) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Workspace или member не найден' },
      });
    }

    // Проверка прав: только OWNER, ADMIN, MANAGER
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(req.member.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Недостаточно прав для просмотра обзора команды',
        },
      });
    }

    // Получаем всех членов команды
    const members = await prisma.member.findMany({
      where: {
        workspaceId: req.workspace.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const now = new Date();

    // Для каждого члена команды собираем статистику
    const teamStats = await Promise.all(
      members.map(async (member) => {
        // Задачи пользователя
        const tasks = await prisma.task.findMany({
          where: {
            workspaceId: req.workspace.id,
            assignedToUserId: member.userId,
          },
          select: {
            status: true,
            dueAt: true,
          },
        });

        const totalTasks = tasks.length;
        const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
        const overdueTasks = tasks.filter(
          (t) => t.dueAt && new Date(t.dueAt) < now && t.status !== 'DONE' && t.status !== 'CANCELLED'
        ).length;

        // Активные сделки пользователя
        const activeDeals = await prisma.deal.count({
          where: {
            workspaceId: req.workspace.id,
            assignedToUserId: member.userId,
            stage: { notIn: ['closed_won', 'closed_lost'] },
          },
        });

        // Определяем индикацию загрузки
        let loadStatus: 'green' | 'yellow' | 'red' = 'green';
        if (overdueTasks > 0) {
          loadStatus = overdueTasks > 3 ? 'red' : 'yellow';
        }

        return {
          userId: member.userId,
          email: member.user.email,
          role: member.role,
          tasks: {
            total: totalTasks,
            done: doneTasks,
            overdue: overdueTasks,
          },
          activeDeals,
          loadStatus,
        };
      })
    );

    res.json({
      success: true,
      data: {
        team: teamStats,
      },
    });
  } catch (error) {
    console.error('Get team overview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при получении обзора команды',
      },
    });
  }
});

export default router;
