'use client';

import { TimelineEvent } from '@/lib/api';
import { UserPlus, Edit, Trash2, Briefcase, CheckSquare, Users, Calendar } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (entityType: string, action: string) => {
  if (action === 'DELETE') return Trash2;
  if (action === 'UPDATE') return Edit;
  if (action === 'CREATE') {
    if (entityType === 'Client') return Users;
    if (entityType === 'Deal') return Briefcase;
    if (entityType === 'Task') return CheckSquare;
    return UserPlus;
  }
  return Calendar;
};

const getEventLabel = (event: TimelineEvent): string => {
  const { entityType, action } = event;
  
  if (action === 'CREATE') {
    if (entityType === 'Client') return 'Клиент создан';
    if (entityType === 'Deal') return 'Сделка создана';
    if (entityType === 'Task') return 'Задача создана';
    return `${entityType} создан`;
  }
  
  if (action === 'UPDATE') {
    if (entityType === 'Client') return 'Клиент обновлен';
    if (entityType === 'Deal') return 'Сделка обновлена';
    if (entityType === 'Task') return 'Задача обновлена';
    return `${entityType} обновлен`;
  }
  
  if (action === 'DELETE') {
    if (entityType === 'Client') return 'Клиент удален';
    if (entityType === 'Deal') return 'Сделка удалена';
    if (entityType === 'Task') return 'Задача удалена';
    return `${entityType} удален`;
  }
  
  if (action === 'CHECK') {
    if (entityType === 'DEAL_CHECKLIST') {
      try {
        const payload = event.payloadJson ? JSON.parse(event.payloadJson) : {};
        return `Отмечен пункт чек-листа: ${payload.itemTitle || ''}`;
      } catch {
        return 'Отмечен пункт чек-листа';
      }
    }
  }
  
  if (action === 'UNCHECK') {
    if (entityType === 'DEAL_CHECKLIST') {
      try {
        const payload = event.payloadJson ? JSON.parse(event.payloadJson) : {};
        return `Снят пункт чек-листа: ${payload.itemTitle || ''}`;
      } catch {
        return 'Снят пункт чек-листа';
      }
    }
  }
  
  return `${action} ${entityType}`;
};

const getEventColor = (action: string): string => {
  if (action === 'CREATE') return 'bg-green-100 text-green-600';
  if (action === 'UPDATE') return 'bg-blue-100 text-blue-600';
  if (action === 'DELETE') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-600';
};

export default function Timeline({ events }: TimelineProps) {
  return (
    <div>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.entityType, event.action);
            const color = getEventColor(event.action);
            const label = getEventLabel(event);
            const date = new Date(event.createdAt);

            return (
              <div key={event.id} className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.actor.email} • {date.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

