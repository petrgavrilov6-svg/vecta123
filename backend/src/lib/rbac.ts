/**
 * RBAC (Role-Based Access Control) утилиты
 * 
 * Определяет права доступа для различных действий в CRM.
 * Используется для проверки прав в middleware и frontend.
 */

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';

export const ROLES: Role[] = ['OWNER', 'ADMIN', 'MANAGER', 'AGENT', 'VIEWER'];

/**
 * Проверяет, может ли роль выполнить действие
 */
export function canPerformAction(role: Role, action: string): boolean {
  const permissions: Record<Role, string[]> = {
    OWNER: [
      // Клиенты
      'client.update.name',
      'client.update.all',
      'client.delete',
      // Сделки
      'deal.update.stage',
      'deal.update.amount',
      'deal.update.all',
      'deal.delete',
      // Чек-листы
      'checklist.update',
      // Задачи
      'task.update.all',
      'task.delete',
    ],
    ADMIN: [
      // Клиенты
      'client.update.name',
      'client.update.all',
      'client.delete',
      // Сделки
      'deal.update.stage',
      'deal.update.amount',
      'deal.update.all',
      'deal.delete',
      // Чек-листы
      'checklist.update',
      // Задачи
      'task.update.all',
      'task.delete',
    ],
    MANAGER: [
      // Клиенты
      'client.update.name',
      'client.update.all',
      // Сделки
      'deal.update.stage',
      'deal.update.amount',
      'deal.update.all',
      // Чек-листы
      'checklist.update',
      // Задачи
      'task.update.all',
    ],
    AGENT: [
      // Клиенты
      'client.update.name',
      // Сделки
      'deal.update.stage',
      'deal.update.amount',
      // Чек-листы
      'checklist.update',
      // Задачи
      'task.update.all',
    ],
    VIEWER: [
      // Только просмотр, никаких изменений
    ],
  };

  return permissions[role]?.includes(action) || false;
}

/**
 * Получает список разрешенных действий для роли
 */
export function getPermissions(role: Role): string[] {
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

  return permissions[role] || [];
}

