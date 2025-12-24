'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { dealsApi, Deal, CreateDealInput, clientsApi, Client } from '@/lib/api';
import { Briefcase, Plus, Edit, Trash2, Loader2, X, DollarSign, User, Filter } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { authApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

// Pipeline stages (можно вынести в конфиг или получать с backend)
const PIPELINE_STAGES = [
  { id: 'lead', name: 'Лид', color: 'bg-gray-100 text-gray-800' },
  { id: 'qualification', name: 'Квалификация', color: 'bg-blue-100 text-blue-800' },
  { id: 'proposal', name: 'Предложение', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'negotiation', name: 'Переговоры', color: 'bg-orange-100 text-orange-800' },
  { id: 'closed_won', name: 'Закрыта (Успех)', color: 'bg-green-100 text-green-800' },
  { id: 'closed_lost', name: 'Закрыта (Потеря)', color: 'bg-red-100 text-red-800' },
];

export default function DealsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateDealInput>({
    stage: 'lead',
    clientId: '',
    amount: undefined,
    assignedToUserId: '',
  });

  useEffect(() => {
    loadData();
    
    // Проверяем query параметры для предзаполнения
    const newParam = searchParams.get('new');
    const clientIdParam = searchParams.get('clientId');
    if (newParam === 'true' && clientIdParam) {
      setTimeout(() => {
        handleOpenModal();
        setFormData((prev) => ({ ...prev, clientId: clientIdParam }));
      }, 100);
    }
  }, [workspaceSlug, searchParams]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allDeals, filterStage, filterAssignedToMe, currentUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadDeals(), loadClients()]);
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

  const loadDeals = async () => {
    try {
      const response = await dealsApi.list(workspaceSlug);
      if (response.success && response.data) {
        setAllDeals(response.data.deals);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allDeals];

    if (filterStage !== 'all') {
      filtered = filtered.filter((deal) => deal.stage === filterStage);
    }

    if (filterAssignedToMe && currentUserId) {
      filtered = filtered.filter((deal) => deal.assignedToUserId === currentUserId);
    }

    setDeals(filtered);
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

  const handleOpenModal = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        stage: deal.stage,
        clientId: deal.clientId || '',
        amount: deal.amount ? parseFloat(deal.amount) : undefined,
        assignedToUserId: deal.assignedToUserId || '',
      });
    } else {
      setEditingDeal(null);
      setFormData({
        stage: 'lead',
        clientId: '',
        amount: undefined,
        assignedToUserId: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDeal(null);
    setFormData({
      stage: 'lead',
      clientId: '',
      amount: undefined,
      assignedToUserId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      if (editingDeal) {
        await dealsApi.update(workspaceSlug, editingDeal.id, formData);
      } else {
        await dealsApi.create(workspaceSlug, formData);
      }
      handleCloseModal();
      await loadDeals();
      
      // Онбординг: подсказка после первой сделки
      const dealsAfter = await dealsApi.list(workspaceSlug);
      if (dealsAfter.success && dealsAfter.data?.deals.length === 1) {
        toast.success('Сделка создана! Теперь назначьте задачу', 8000);
      } else {
        toast.success(editingDeal ? 'Сделка обновлена' : 'Сделка создана');
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Не удалось сохранить. Проверьте подключение к интернету');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Удалить эту сделку? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await dealsApi.delete(workspaceSlug, dealId);
      await loadDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Не удалось удалить сделку. Проверьте подключение к интернету');
    }
  };

  const handleStageChange = async (deal: Deal, newStage: string) => {
    try {
      await dealsApi.update(workspaceSlug, deal.id, { stage: newStage });
      await loadDeals();
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast.error('Не удалось изменить этап. Проверьте подключение к интернету');
    }
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage === stageId);
  };

  const getStageTotal = (stageId: string) => {
    const stageDeals = getDealsByStage(stageId);
    return stageDeals.reduce((sum, deal) => {
      const amount = deal.amount ? parseFloat(deal.amount) : 0;
      return sum + amount;
    }, 0);
  };

  const formatAmount = (amount: string | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Сделки</h1>
          <p className="text-gray-600 mt-1">Воронка продаж и управление сделками</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Добавить сделку
        </button>
      </div>

      {/* Filters */}
      {allDeals.length > 0 && (
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={18} />
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все этапы</option>
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterAssignedToMe}
                onChange={(e) => setFilterAssignedToMe(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Назначенные мне</span>
            </label>
            {(filterStage !== 'all' || filterAssignedToMe) && (
              <button
                onClick={() => {
                  setFilterStage('all');
                  setFilterAssignedToMe(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Сбросить фильтры
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
      ) : deals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <EmptyState
            icon={Briefcase}
            title="Создайте первую сделку"
            description="Воронка продаж поможет вам видеть, на каком этапе находится каждая сделка - от первого контакта до закрытия. Свяжите сделку с клиентом и начните отслеживать прогресс."
            actionLabel="Создать сделку"
            onAction={() => handleOpenModal()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            return (
              <div key={stage.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className={`p-3 rounded-t-lg ${stage.color}`}>
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <p className="text-xs opacity-75 mt-1">{stageDeals.length} сделок</p>
                  {getStageTotal(stage.id) > 0 && (
                    <p className="text-xs font-semibold mt-1">
                      {formatAmount(String(getStageTotal(stage.id)))}
                    </p>
                  )}
                </div>
                <div className="p-2 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-gray-50 rounded-md p-3 hover:shadow-md transition-shadow border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          href={`/app/${workspaceSlug}/deals/${deal.id}`}
                          className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors flex-1"
                        >
                          {deal.client?.name || 'Без клиента'}
                        </Link>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(deal);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Редактировать"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(deal.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {deal.amount && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600 mb-2">
                          <DollarSign size={14} />
                          {formatAmount(deal.amount)}
                        </div>
                      )}

                      {deal.client?.email && (
                        <div className="text-xs text-gray-500 mb-2">{deal.client.email}</div>
                      )}

                      {/* Перемещение между этапами */}
                      <select
                        value={deal.stage}
                        onChange={(e) => handleStageChange(deal, e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">
                      Нет сделок
                    </div>
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
                {editingDeal ? 'Редактировать сделку' : 'Добавить сделку'}
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
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Клиент
                </label>
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
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
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                  Этап *
                </label>
                <select
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма (₽)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                      editingDeal ? 'Сохранить' : 'Создать'
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


