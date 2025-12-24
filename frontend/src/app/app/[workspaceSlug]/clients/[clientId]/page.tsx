'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, dealsApi, tasksApi, membersApi, Client, Deal, Task, TimelineEvent } from '@/lib/api';
import { canPerformAction, Role } from '@/lib/rbac';
import {
  Users,
  Briefcase,
  CheckSquare,
  Mail,
  Phone,
  Tag,
  Edit,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Timeline from '@/components/Timeline';

const STAGE_LABELS: Record<string, string> = {
  lead: 'Лид',
  qualification: 'Квалификация',
  proposal: 'Предложение',
  negotiation: 'Переговоры',
  closed_won: 'Закрыта (успех)',
  closed_lost: 'Закрыта (неудача)',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнена',
  CANCELLED: 'Отменена',
};

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const clientId = params.clientId as string;
  const toast = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    loadData();
    loadUserRole();
  }, [workspaceSlug, clientId]);

  const loadUserRole = async () => {
    try {
      const response = await membersApi.getCurrent(workspaceSlug);
      if (response.success && response.data) {
        setUserRole(response.data.member.role as Role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const clientRes = await clientsApi.get(workspaceSlug, clientId);

      if (clientRes.success && clientRes.data) {
        const clientData = clientRes.data.client;
        setClient(clientData);
        setNameValue(clientData.name);
        setDeals(clientData.deals || []);
        setTasks(clientData.tasks || []);
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Не удалось загрузить данные клиента');
      router.push(`/app/${workspaceSlug}/clients`);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    if (timeline.length > 0 || loadingTimeline) return; // Уже загружен
    
    try {
      setLoadingTimeline(true);
      const timelineRes = await clientsApi.timeline(workspaceSlug, clientId);
      if (timelineRes.success && timelineRes.data) {
        setTimeline(timelineRes.data.events);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      toast.error('Не удалось загрузить историю');
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleTimelineToggle = () => {
    if (!showTimeline) {
      loadTimeline();
    }
    setShowTimeline(!showTimeline);
  };

  const handleNameSave = async () => {
    if (!client || nameValue.trim() === client.name) {
      setEditingName(false);
      return;
    }

    try {
      setSaving(true);
      await clientsApi.update(workspaceSlug, clientId, { name: nameValue.trim() });
      await loadData();
      setEditingName(false);
      toast.success('Имя клиента обновлено');
    } catch (error) {
      toast.error('Не удалось обновить имя');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Клиент не найден</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/app/${workspaceSlug}/clients`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          Назад к списку клиентов
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') {
                      setNameValue(client.name);
                      setEditingName(false);
                    }
                  }}
                  autoFocus
                  className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                  disabled={saving}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                {userRole && canPerformAction(userRole, 'client.update.name') ? (
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Редактировать имя"
                  >
                    <Edit size={18} />
                  </button>
                ) : (
                  <span className="p-1 text-gray-300 cursor-not-allowed" title="Недостаточно прав">
                    <Edit size={18} />
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <a href={`tel:${client.phone}`} className="hover:text-blue-600">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.tags && (
                <div className="flex items-center gap-2">
                  <Tag size={16} />
                  <span>{client.tags}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Link
              href={`/app/${workspaceSlug}/deals?new=true&clientId=${clientId}`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              Создать сделку
            </Link>
            <Link
              href={`/app/${workspaceSlug}/tasks?new=true&clientId=${clientId}`}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              <Plus size={16} />
              Создать задачу
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Notes */}
          {client.notes && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Заметки</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          {/* Deals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase size={20} />
                Сделки ({deals.length})
              </h2>
            </div>
            <div className="p-6">
              {deals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Нет сделок для этого клиента
                </p>
              ) : (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/app/${workspaceSlug}/deals/${deal.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {STAGE_LABELS[deal.stage] || deal.stage}
                          </p>
                          {deal.amount && (
                            <p className="text-sm text-gray-600 mt-1">
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                              }).format(parseFloat(deal.amount))}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(deal.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare size={20} />
                Задачи ({tasks.length})
              </h2>
            </div>
            <div className="p-6">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Нет задач для этого клиента
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/app/${workspaceSlug}/tasks`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {STATUS_LABELS[task.status] || task.status}
                          </p>
                          {task.dueAt && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(task.dueAt).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={handleTimelineToggle}
              className="w-full p-6 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History size={20} />
                История действий
              </h2>
              {showTimeline ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>
            {showTimeline && (
              <div className="p-6">
                {loadingTimeline ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                ) : timeline.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    История появится после первых действий
                  </p>
                ) : (
                  <Timeline events={timeline} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

