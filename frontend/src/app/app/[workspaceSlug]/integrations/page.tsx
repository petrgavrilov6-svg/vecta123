'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { integrationsApi, Integration, CreateIntegrationInput } from '@/lib/api';
import { authApi } from '@/lib/api';
import { Plug, Plus, Edit, Trash2, Loader2, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function IntegrationsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<CreateIntegrationInput>({
    type: 'EMAIL',
    status: 'INACTIVE',
    dataJson: '',
  });

  useEffect(() => {
    checkAuthAndLoadIntegrations();
  }, [workspaceSlug]);

  const checkAuthAndLoadIntegrations = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success) {
        router.push('/login');
        return;
      }
      await loadIntegrations();
    } catch (error) {
      router.push('/login');
    }
  };

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.list(workspaceSlug);
      if (response.success && response.data) {
        setIntegrations(response.data.integrations);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (integration?: Integration) => {
    if (integration) {
      setEditingIntegration(integration);
      setFormData({
        type: integration.type,
        status: integration.status,
        dataJson: integration.dataJson || '',
      });
    } else {
      setEditingIntegration(null);
      setFormData({
        type: 'EMAIL',
        status: 'INACTIVE',
        dataJson: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIntegration(null);
    setFormData({
      type: 'EMAIL',
      status: 'INACTIVE',
      dataJson: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIntegration) {
        await integrationsApi.update(workspaceSlug, editingIntegration.id, formData);
      } else {
        await integrationsApi.create(workspaceSlug, formData);
      }
      handleCloseModal();
      await loadIntegrations();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast.error('Ошибка при сохранении интеграции');
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту интеграцию?')) {
      return;
    }
    try {
      await integrationsApi.delete(workspaceSlug, integrationId);
      await loadIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast.error('Ошибка при удалении интеграции');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'ERROR':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активна';
      case 'ERROR':
        return 'Ошибка';
      default:
        return 'Неактивна';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'Email';
      case 'TELEGRAM':
        return 'Telegram';
      case 'VK':
        return 'VK';
      case 'WHATSAPP':
        return 'WhatsApp';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Интеграции</h1>
              <p className="text-sm text-gray-600 mt-1">Управление интеграциями с внешними сервисами</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Добавить интеграцию
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {integrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Plug className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет интеграций</h3>
            <p className="text-gray-600 mb-4">Начните с добавления первой интеграции</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Добавить интеграцию
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Plug className="text-blue-600" size={24} />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getTypeLabel(integration.type)}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(integration.status)}
                        <span className="text-sm text-gray-600">{getStatusLabel(integration.status)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(integration)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {integration.dataJson && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Настройки (JSON):</p>
                    <p className="text-xs font-mono text-gray-700 truncate">{integration.dataJson}</p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Создано: {new Date(integration.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingIntegration ? 'Редактировать интеграцию' : 'Добавить интеграцию'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип интеграции</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="EMAIL">Email</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="VK">VK</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="INACTIVE">Неактивна</option>
                  <option value="ACTIVE">Активна</option>
                  <option value="ERROR">Ошибка</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Настройки (JSON, опционально)
                </label>
                <textarea
                  value={formData.dataJson}
                  onChange={(e) => setFormData({ ...formData, dataJson: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder='{"token": "xxx", "apiKey": "yyy"}'
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingIntegration ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


