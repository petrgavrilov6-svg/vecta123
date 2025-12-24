/**
 * Утилиты для автоматизации задач
 * 
 * Создание задач на основе шаблонов при событиях (создание сделки, смена стадии)
 */

import { prisma } from './prisma.js';
import { logAuditEvent } from './audit.js';

/**
 * Создать задачи на основе шаблонов для события
 */
export async function createTasksFromTemplates(
  workspaceId: string,
  userId: string,
  triggerType: 'DEAL_CREATED' | 'DEAL_STAGE_CHANGED',
  triggerValue: string | null, // для DEAL_STAGE_CHANGED - название стадии
  dealId: string,
  clientId: string | null,
  assignedToUserId: string | null
): Promise<void> {
  // Находим подходящие шаблоны
  const templates = await prisma.taskTemplate.findMany({
    where: {
      workspaceId,
      triggerType,
      ...(triggerType === 'DEAL_STAGE_CHANGED' && triggerValue
        ? { triggerValue }
        : {}),
    },
  });

  if (templates.length === 0) {
    return; // Нет шаблонов для этого события
  }

  // Создаём задачи по каждому шаблону
  for (const template of templates) {
    const dueAt = template.dueDays
      ? new Date(Date.now() + template.dueDays * 24 * 60 * 60 * 1000)
      : null;

    const task = await prisma.task.create({
      data: {
        workspaceId,
        title: template.title,
        description: template.description,
        dueAt,
        status: template.status as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
        assignedToUserId: assignedToUserId || undefined,
        relatedDealId: dealId,
        relatedClientId: clientId || undefined,
      },
    });

    // Audit log
    await logAuditEvent({
      workspaceId,
      actorUserId: userId,
      entityType: 'Task',
      entityId: task.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({
        title: task.title,
        status: task.status,
        autoCreated: true,
        templateId: template.id,
        triggerType,
        triggerValue,
      }),
    });
  }
}

/**
 * Инициализировать дефолтные шаблоны задач для workspace
 */
export async function initializeDefaultTaskTemplates(workspaceId: string): Promise<void> {
  // Шаблон для создания сделки
  await prisma.taskTemplate.upsert({
    where: {
      id: `${workspaceId}-deal-created`,
    },
    create: {
      id: `${workspaceId}-deal-created`,
      workspaceId,
      triggerType: 'DEAL_CREATED',
      triggerValue: null,
      title: 'Первичный контакт',
      description: 'Связаться с клиентом и обсудить потребности',
      dueDays: 1, // через 1 день
      status: 'TODO',
    },
    update: {},
  });

  // Шаблоны для смены стадий
  const stageTemplates = [
    {
      stage: 'qualification',
      title: 'Провести квалификацию',
      description: 'Уточнить потребности, бюджет и сроки',
      dueDays: 2,
    },
    {
      stage: 'proposal',
      title: 'Подготовить коммерческое предложение',
      description: 'Сформировать и отправить КП клиенту',
      dueDays: 3,
    },
    {
      stage: 'negotiation',
      title: 'Обсудить условия',
      description: 'Согласовать условия договора',
      dueDays: 5,
    },
  ];

  for (const template of stageTemplates) {
    await prisma.taskTemplate.upsert({
      where: {
        id: `${workspaceId}-stage-${template.stage}`,
      },
      create: {
        id: `${workspaceId}-stage-${template.stage}`,
        workspaceId,
        triggerType: 'DEAL_STAGE_CHANGED',
        triggerValue: template.stage,
        title: template.title,
        description: template.description,
        dueDays: template.dueDays,
        status: 'TODO',
      },
      update: {},
    });
  }
}

