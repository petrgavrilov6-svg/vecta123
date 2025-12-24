import { prisma } from './prisma.js';

export interface AuditEventData {
  workspaceId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK' | 'UNCHECK';
  payloadJson?: string;
}

export async function logAuditEvent(data: AuditEventData) {
  try {
    await prisma.auditEvent.create({
      data: {
        workspaceId: data.workspaceId,
        actorUserId: data.actorUserId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        payloadJson: data.payloadJson,
      },
    });
  } catch (error) {
    // Не прерываем выполнение при ошибке аудита
    console.error('Failed to log audit event:', error);
  }
}


