'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { dealsApi, tasksApi, membersApi, Deal, Task, TimelineEvent, DealChecklistItem } from '@/lib/api';
import { canPerformAction, Role } from '@/lib/rbac';
import {
  Briefcase,
  CheckSquare,
  Edit,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
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

// Чек-листы для этапов сделки
const STAGE_CHECKLISTS: Record<string, string[]> = {
  lead: ['Первичный контакт установлен', 'Потребность выявлена', 'Бюджет определен'],
  qualification: ['Квалификация пройдена', 'Решение принято', 'Сроки согласованы'],
  proposal: ['Коммерческое предложение отправлено', 'Презентация проведена', 'Вопросы клиента получены'],
  negotiation: ['Условия обсуждены', 'Скидка согласована', 'Договор подготовлен'],
  closed_won: ['Договор подписан', 'Оплата получена', 'Проект запущен'],
  closed_lost: ['Причина отказа выяснена', 'Обратная связь получена', 'Клиент в базе сохранен'],
};


export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const dealId = params.dealId as string;
  const toast = useToast();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStage, setEditingStage] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [stageValue, setStageValue] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<DealChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    loadData();
    loadUserRole();
  }, [workspaceSlug, dealId]);

  useEffect(() => {
    // Загружаем чек-лист из backend
    if (deal) {
      loadChecklist();
    }
  }, [deal, dealId, workspaceSlug]);

  const loadChecklist = async () => {
    if (!deal) return;
    try {
      setLoadingChecklist(true);
      const response = await dealsApi.getChecklist(workspaceSlug, dealId);
      if (response.success && response.data) {
        setChecklist(response.data.items);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      toast.error('Не удалось загрузить чек-лист');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const dealRes = await dealsApi.get(workspaceSlug, dealId);

      if (dealRes.success && dealRes.data) {
        const dealData = dealRes.data.deal;
        setDeal(dealData);
        setStageValue(dealData.stage);
        setAmountValue(dealData.amount || '');
        setTasks(dealData.tasks || []);
      }
    } catch (error) {
      console.error('Error loading deal:', error);
      toast.error('Не удалось загрузить данные сделки');
      router.push(`/app/${workspaceSlug}/deals`);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    if (timeline.length > 0 || loadingTimeline) return; // Уже загружен
    
    try {
      setLoadingTimeline(true);
      const timelineRes = await dealsApi.timeline(workspaceSlug, dealId);
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

  const handleStageSave = async () => {
    if (!deal || stageValue === deal.stage) {
      setEditingStage(false);
      return;
    }

    try {
      setSaving(true);
      await dealsApi.update(workspaceSlug, dealId, { stage: stageValue });
      await loadData();
      setEditingStage(false);
      toast.success('Этап сделки обновлен');
    } catch (error) {
      toast.error('Не удалось обновить этап');
    } finally {
      setSaving(false);
    }
  };

  const handleAmountSave = async () => {
    if (!deal) {
      setEditingAmount(false);
      return;
    }

    const amount = amountValue ? parseFloat(amountValue) : null;
    const currentAmount = deal.amount ? parseFloat(deal.amount) : null;

    if (amount === currentAmount) {
      setEditingAmount(false);
      return;
    }

    try {
      setSaving(true);
      await dealsApi.update(workspaceSlug, dealId, { amount: amount || undefined });
      await loadData();
      setEditingAmount(false);
      toast.success('Сумма сделки обновлена');
    } catch (error) {
      toast.error('Не удалось обновить сумму');
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistToggle = async (item: DealChecklistItem) => {
    if (!deal) return;
    try {
      const newCompleted = !item.completed;
      const response = await dealsApi.updateChecklistItem(workspaceSlug, dealId, {
        itemTitle: item.title,
        completed: newCompleted,
      });
      
      if (response.success && response.data) {
        // Обновляем локальное состояние
        loadChecklist(); // Перезагружаем весь чек-лист для получения актуальных данных
        
        if (newCompleted) {
          toast.success('Пункт отмечен');
          
          // Показываем подсказку, если чек-лист завершен
          if (response.data.checklistComplete) {
            toast.success('Чек-лист этапа завершен! Можно перевести сделку на следующий этап.', {
              duration: 5000,
            });
          }
        } else {
          toast.success('Пункт снят');
        }
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Не удалось обновить чек-лист');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Сделка не найдена</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/app/${workspaceSlug}/deals`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          Назад к воронке
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Сделка</h1>

            {/* Stage */}
            <div className="mb-3">
              {editingStage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={stageValue}
                    onChange={(e) => setStageValue(e.target.value)}
                    onBlur={handleStageSave}
                    autoFocus
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={saving}
                  >
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                    {STAGE_LABELS[deal.stage] || deal.stage}
                  </span>
                  {userRole && canPerformAction(userRole, 'deal.update.stage') ? (
                    <button
                      onClick={() => setEditingStage(true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Изменить этап"
                    >
                      <Edit size={16} />
                    </button>
                  ) : (
                    <span className="p-1 text-gray-300 cursor-not-allowed" title="Недостаточно прав">
                      <Edit size={16} />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="mb-3">
              {editingAmount ? (
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-gray-400" />
                  <input
                    type="number"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    onBlur={handleAmountSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAmountSave();
                      if (e.key === 'Escape') {
                        setAmountValue(deal.amount || '');
                        setEditingAmount(false);
                      }
                    }}
                    placeholder="Сумма"
                    autoFocus
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                    disabled={saving}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-gray-400" />
                  <span className="text-xl font-semibold text-gray-900">
                    {deal.amount
                      ? new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                        }).format(parseFloat(deal.amount))
                      : 'Не указана'}
                  </span>
                  {userRole && canPerformAction(userRole, 'deal.update.amount') ? (
                    <button
                      onClick={() => setEditingAmount(true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Изменить сумму"
                    >
                      <Edit size={16} />
                    </button>
                  ) : (
                    <span className="p-1 text-gray-300 cursor-not-allowed" title="Недостаточно прав">
                      <Edit size={16} />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Client */}
            {deal.client && (
              <div className="flex items-center gap-2 text-gray-600">
                <User size={18} />
                <Link
                  href={`/app/${workspaceSlug}/clients/${deal.client!.id}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  {deal.client.name}
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Link
              href={`/app/${workspaceSlug}/tasks?new=true&dealId=${dealId}`}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              <Plus size={16} />
              Создать задачу
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Чек-лист этапа</h2>
              {loadingChecklist ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                </div>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleChecklistToggle(item)}
                        disabled={!userRole || !canPerformAction(userRole, 'checklist.update')}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!userRole || !canPerformAction(userRole, 'checklist.update') ? 'Недостаточно прав' : ''}
                      />
                      <span
                        className={`flex-1 ${
                          item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.completed && item.completedBy && (
                        <span className="text-xs text-gray-500">
                          {item.completedBy.email}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

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
                <p className="text-gray-500 text-center py-4">Нет задач для этой сделки</p>
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

