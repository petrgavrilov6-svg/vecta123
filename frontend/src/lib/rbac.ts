/**
 * RBAC (Role-Based Access Control) утилиты для frontend
 * 
 * Определяет права доступа для различных действий в CRM.
 * Синхронизировано с backend/src/lib/rbac.ts
 */

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';

/**
 * Проверяет, может ли роль выполнить действие
 */
export function canPerformAction(role: Role, action: string): boolean {
  const permissions: Record<Role, string[]> = {
    OWNER: [
      'client.update.name',
      'client.update.all',
      'client.delete',
      'deal.update.stage',
      'deal.update.amount',
      'deal.update.all',
      'deal.delete',
      'checklist.update',
      'task.update.all',
      'task.delete',
    ],
    ADMIN: [
      'client.update.name',
      'client.update.all',
      'client.delete',
      'deal.update.stage',
      'deal.update.amount',
      'deal.update.all',
      'deal.delete',
      'checklist.update',
      'task.update.all',
      'task.delete',
    ],
    MANAGER: [
      'client.update.name',
      'client.update.all',
      'deal.update.stage',
      'deal.update.amount',
      'deal.update.all',
      'checklist.update',
      'task.update.all',
    ],
    AGENT: [
      'client.update.name',
      'deal.update.stage',
      'deal.update.amount',
      'checklist.update',
      'task.update.all',
    ],
    VIEWER: [],
  };

  return permissions[role]?.includes(action) || false;
}

