'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, Client, CreateClientInput } from '@/lib/api';
import { Users, Plus, Edit, Trash2, Mail, Phone, Tag, Loader2, X, Download, Upload, Search, ArrowUpDown } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/contexts/ToastContext';

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

export default function ClientsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateClientInput>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    tags: '',
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    loadClients();
  }, [workspaceSlug]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientsApi.list(workspaceSlug);
      if (response.success && response.data) {
        setAllClients(response.data.clients);
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация и сортировка
  useEffect(() => {
    let filtered = [...allClients];

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query)
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setClients(filtered);
  }, [allClients, searchQuery, sortBy]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
        tags: client.tags || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        notes: '',
        tags: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
      tags: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      if (editingClient) {
        await clientsApi.update(workspaceSlug, editingClient.id, formData);
      } else {
        await clientsApi.create(workspaceSlug, formData);
      }
      handleCloseModal();
      await loadClients();
      
      // Онбординг: подсказка после первого клиента
      const clientsAfter = await clientsApi.list(workspaceSlug);
      if (clientsAfter.success && clientsAfter.data?.clients.length === 1) {
        toast.success('Клиент добавлен! Теперь создайте сделку', 8000);
      } else {
        toast.success(editingClient ? 'Клиент обновлен' : 'Клиент добавлен');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Не удалось сохранить. Проверьте подключение к интернету');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Удалить этого клиента? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await clientsApi.delete(workspaceSlug, clientId);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Не удалось удалить клиента. Проверьте подключение к интернету');
    }
  };

  const handleExport = async () => {
    try {
      await clientsApi.export(workspaceSlug);
    } catch (error) {
      console.error('Error exporting clients:', error);
      toast.error('Не удалось экспортировать. Проверьте подключение к интернету');
    }
  };

  const handleImport = async () => {
    if (!importCsvText.trim()) {
      toast.warning('Введите CSV данные');
      return;
    }
    try {
      setImporting(true);
      setImportResult(null);
      const response = await clientsApi.import(workspaceSlug, importCsvText);
      if (response.success && response.data) {
        setImportResult(response.data);
        await loadClients();
        if (response.data.failed === 0) {
          setShowImportModal(false);
          setImportCsvText('');
        }
      }
    } catch (error) {
      console.error('Error importing clients:', error);
      toast.error('Не удалось импортировать. Проверьте формат данных');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportCsvText(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600 mt-1">Управление базой клиентов</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {clients.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download size={18} />
                Экспорт CSV
              </button>
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setImportCsvText('');
                  setImportResult(null);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Upload size={18} />
                Импорт CSV
              </button>
            </>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Добавить клиента
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      {allClients.length > 0 && (
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Поиск по имени, email или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="text-gray-400" size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name-asc">Имя (А-Я)</option>
                <option value="name-desc">Имя (Я-А)</option>
                <option value="date-asc">Дата (старые)</option>
                <option value="date-desc">Дата (новые)</option>
              </select>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Найдено: {clients.length} из {allClients.length}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <EmptyState
            icon={Users}
            title={searchQuery ? "Ничего не найдено" : "Начните с добавления первого клиента"}
            description={searchQuery ? "Попробуйте изменить поисковый запрос" : "Это ваша база контактов - здесь вы храните информацию о людях и компаниях, с которыми работаете. Добавьте первого клиента, чтобы начать работу."}
            actionLabel={searchQuery ? "Очистить поиск" : "Добавить клиента"}
            onAction={() => {
              if (searchQuery) {
                setSearchQuery('');
              } else {
                handleOpenModal();
              }
            }}
          />
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <Link
                    href={`/app/${workspaceSlug}/clients/${client.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors flex-1"
                  >
                    {client.name}
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(client);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Редактировать"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(client.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.tags && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag size={16} />
                      <span>{client.tags}</span>
                    </div>
                  )}
                  {client.notes && (
                    <p className="text-sm text-gray-600 mt-2">{client.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Теги (через запятую)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Заметки
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
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
                    editingClient ? 'Сохранить' : 'Создать'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Импорт клиентов из CSV</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportCsvText('');
                  setImportResult(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Загрузить CSV файл
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Формат CSV: name,email,phone,notes,tags (первая строка - заголовки)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Или вставьте CSV текст
                </label>
                <textarea
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="name,email,phone,notes,tags&#10;Иван Петров,ivan@example.com,+7 999 123-45-67,Заметка,Тег1"
                />
              </div>

              {importResult && (
                <div className={`p-4 rounded-md ${
                  importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className="font-medium text-gray-900 mb-2">
                    Импорт завершён: {importResult.imported} успешно, {importResult.failed} ошибок
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Ошибки:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {importResult.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportCsvText('');
                    setImportResult(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importCsvText.trim() || importing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? 'Импорт...' : 'Импортировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

