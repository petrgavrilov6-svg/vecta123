'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { tasksApi, Task, CreateTaskInput, clientsApi, Client, dealsApi, Deal } from '@/lib/api';
import { CheckSquare, Plus, Edit, Trash2, Loader2, X, Calendar, User, Briefcase, Filter } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { authApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

const TASK_STATUSES = [
  { id: 'TODO', name: 'К выполнению', color: 'bg-gray-100 text-gray-800' },
  { id: 'IN_PROGRESS', name: 'В работе', color: 'bg-blue-100 text-blue-800' },
  { id: 'DONE', name: 'Выполнено', color: 'bg-green-100 text-green-800' },
  { id: 'CANCELLED', name: 'Отменено', color: 'bg-red-100 text-red-800' },
];

type TaskFilter = 'all' | 'today' | 'overdue' | 'assigned-to-me';

export default function TasksPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    status: 'TODO',
    dueAt: '',
    relatedClientId: '',
    relatedDealId: '',
    assignedToUserId: '',
  });

  useEffect(() => {
    loadData();
  }, [workspaceSlug]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allTasks, filter, currentUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTasks(), loadClients(), loadDeals()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await authApi.me();
      if (response.success && response.data?.user) {
        setCurrentUserId(response.data.user.id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await tasksApi.list(workspaceSlug);
      if (response.success && response.data) {
        setAllTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTasks];

    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter((task) => {
          if (!task.dueAt) return false;
          const dueDate = new Date(task.dueAt);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate < tomorrow;
        });
        break;
      case 'overdue':
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        filtered = filtered.filter((task) => {
          if (!task.dueAt) return false;
          const dueDate = new Date(task.dueAt);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < now && task.status !== 'DONE' && task.status !== 'CANCELLED';
        });
        break;
      case 'assigned-to-me':
        if (currentUserId) {
          filtered = filtered.filter((task) => task.assignedToUserId === currentUserId);
        }
        break;
      case 'all':
      default:
        break;
    }

    setTasks(filtered);
  };

  const loadClients = async () => {
    try {
      const response = await clientsApi.list(workspaceSlug);
      if (response.success && response.data) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadDeals = async () => {
    try {
      const response = await dealsApi.list(workspaceSlug);
      if (response.success && response.data) {
        setDeals(response.data.deals);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
        relatedClientId: task.relatedClientId || '',
        relatedDealId: task.relatedDealId || '',
        assignedToUserId: task.assignedToUserId || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'TODO',
        dueAt: '',
        relatedClientId: '',
        relatedDealId: '',
        assignedToUserId: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'TODO',
      dueAt: '',
      relatedClientId: '',
      relatedDealId: '',
      assignedToUserId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const submitData = {
        ...formData,
        dueAt: formData.dueAt || undefined,
        relatedClientId: formData.relatedClientId || undefined,
        relatedDealId: formData.relatedDealId || undefined,
        assignedToUserId: formData.assignedToUserId || undefined,
      };

      if (editingTask) {
        await tasksApi.update(workspaceSlug, editingTask.id, submitData);
      } else {
        await tasksApi.create(workspaceSlug, submitData);
      }
      handleCloseModal();
      await loadTasks();
      
      // Онбординг: подсказка после первой задачи
      const tasksAfter = await tasksApi.list(workspaceSlug);
      if (tasksAfter.success && tasksAfter.data?.tasks.length === 1) {
        toast.success('Отлично! Вы готовы к работе. Все под контролем!', 8000);
      } else {
        toast.success(editingTask ? 'Задача обновлена' : 'Задача создана');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Не удалось сохранить. Проверьте подключение к интернету');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Удалить эту задачу? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await tasksApi.delete(workspaceSlug, taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Не удалось удалить задачу. Проверьте подключение к интернету');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      await tasksApi.update(workspaceSlug, task.id, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Не удалось изменить статус. Проверьте подключение к интернету');
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date() && tasks.find((t) => t.id === tasks.find((t) => t.dueAt === dueAt)?.id)?.status !== 'DONE';
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
          <p className="text-gray-600 mt-1">Организация работы команды</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Добавить задачу
        </button>
      </div>

      {/* Filters */}
      {allTasks.length > 0 && (
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={18} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as TaskFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все задачи</option>
                <option value="today">Сегодня</option>
                <option value="overdue">Просроченные</option>
                <option value="assigned-to-me">Назначенные мне</option>
              </select>
            </div>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Сбросить фильтр
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <EmptyState
            icon={CheckSquare}
            title="Добавьте первую задачу"
            description="Задачи помогают не забыть важное - звонок клиенту, отправка предложения, встреча. Свяжите задачу с клиентом или сделкой, установите срок - и все будет под контролем."
            actionLabel="Создать первую задачу"
            onAction={() => handleOpenModal()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TASK_STATUSES.map((status) => {
            const statusTasks = getTasksByStatus(status.id as Task['status']);
            return (
              <div key={status.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className={`p-3 rounded-t-lg ${status.color}`}>
                  <h3 className="font-semibold text-sm">{status.name}</h3>
                  <p className="text-xs opacity-75 mt-1">{statusTasks.length} задач</p>
                </div>
                <div className="p-2 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-gray-50 rounded-md p-3 hover:shadow-md transition-shadow border ${
                        isOverdue(task.dueAt) ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm text-gray-900 flex-1">{task.title}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenModal(task)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Редактировать"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                      )}

                      <div className="space-y-1 mb-2">
                        {task.dueAt && (
                          <div className={`flex items-center gap-1 text-xs ${isOverdue(task.dueAt) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            <Calendar size={12} />
                            {formatDate(task.dueAt)}
                            {isOverdue(task.dueAt) && <span className="ml-1">⚠️</span>}
                          </div>
                        )}
                        {task.client && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User size={12} />
                            {task.client.name}
                          </div>
                        )}
                        {task.deal && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Briefcase size={12} />
                            Сделка: {task.deal.stage}
                          </div>
                        )}
                      </div>

                      {/* Изменение статуса */}
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">Нет задач</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Редактировать задачу' : 'Добавить задачу'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Статус *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Срок выполнения
                </label>
                <input
                  id="dueAt"
                  type="datetime-local"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="relatedClientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Связанный клиент
                </label>
                <select
                  id="relatedClientId"
                  value={formData.relatedClientId}
                  onChange={(e) => setFormData({ ...formData, relatedClientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите клиента</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="relatedDealId" className="block text-sm font-medium text-gray-700 mb-1">
                  Связанная сделка
                </label>
                <select
                  id="relatedDealId"
                  value={formData.relatedDealId}
                  onChange={(e) => setFormData({ ...formData, relatedDealId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите сделку</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.client?.name || 'Без клиента'} - {deal.stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Сохранение...
                    </>
                  ) : (
                    editingTask ? 'Сохранить' : 'Создать'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


