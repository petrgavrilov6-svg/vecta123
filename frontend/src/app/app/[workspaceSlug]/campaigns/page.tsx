'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  campaignsApi,
  Campaign,
  CreateCampaignInput,
  templatesApi,
  Template,
  CreateTemplateInput,
  clientsApi,
  Client,
} from '@/lib/api';
import { Mail, Plus, Edit, Trash2, Loader2, X, Send, FileText, Users, Zap } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/contexts/ToastContext';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SCHEDULED: 'Запланирована',
  RUNNING: 'Запущена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  RUNNING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CampaignsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [submittingTemplate, setSubmittingTemplate] = useState(false);
  const [campaignData, setCampaignData] = useState<CreateCampaignInput>({
    name: '',
    templateId: '',
    status: 'DRAFT',
    recipientEmails: [],
  });
  const [templateData, setTemplateData] = useState<CreateTemplateInput>({
    name: '',
    subject: '',
    body: '',
    type: 'EMAIL',
  });
  const [recipientInput, setRecipientInput] = useState('');

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
    loadClients();
  }, [workspaceSlug]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignsApi.list(workspaceSlug);
      if (response.success && response.data) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await templatesApi.list(workspaceSlug);
      if (response.success && response.data) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
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

  const handleOpenCampaignModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignData({
        name: campaign.name,
        templateId: campaign.templateId || '',
        status: campaign.status,
        scheduledAt: campaign.scheduledAt || undefined,
        recipientEmails: [],
      });
    } else {
      setEditingCampaign(null);
      setCampaignData({
        name: '',
        templateId: '',
        status: 'DRAFT',
        recipientEmails: [],
      });
    }
    setRecipientInput('');
    setShowCampaignModal(true);
  };

  const handleCloseCampaignModal = () => {
    setShowCampaignModal(false);
    setEditingCampaign(null);
    setCampaignData({
      name: '',
      templateId: '',
      status: 'DRAFT',
      recipientEmails: [],
    });
    setRecipientInput('');
  };

  const handleOpenTemplateModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateData({
        name: template.name,
        subject: template.subject || '',
        body: template.body,
        type: template.type,
      });
    } else {
      setEditingTemplate(null);
      setTemplateData({
        name: '',
        subject: '',
        body: '',
        type: 'EMAIL',
      });
    }
    setShowTemplateModal(true);
  };

  const handleCloseTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateData({
      name: '',
      subject: '',
      body: '',
      type: 'EMAIL',
    });
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!campaignData.recipientEmails.includes(email)) {
        setCampaignData({
          ...campaignData,
          recipientEmails: [...campaignData.recipientEmails, email],
        });
      }
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setCampaignData({
      ...campaignData,
      recipientEmails: campaignData.recipientEmails.filter((e) => e !== email),
    });
  };

  const handleAddClientsAsRecipients = () => {
    const clientEmails = clients
      .filter((c) => c.email)
      .map((c) => c.email!)
      .filter((email) => !campaignData.recipientEmails.includes(email));
    setCampaignData({
      ...campaignData,
      recipientEmails: [...campaignData.recipientEmails, ...clientEmails],
    });
  };

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingCampaign) return;

    try {
      setSubmittingCampaign(true);
      if (editingCampaign) {
        await campaignsApi.update(workspaceSlug, editingCampaign.id, campaignData);
      } else {
        await campaignsApi.create(workspaceSlug, campaignData);
      }
      handleCloseCampaignModal();
      await loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Ошибка при сохранении кампании');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingTemplate) return;

    try {
      setSubmittingTemplate(true);
      if (editingTemplate) {
        await templatesApi.update(workspaceSlug, editingTemplate.id, templateData);
      } else {
        await templatesApi.create(workspaceSlug, templateData);
      }
      handleCloseTemplateModal();
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Ошибка при сохранении шаблона');
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту кампанию?')) {
      return;
    }
    try {
      await campaignsApi.delete(workspaceSlug, campaignId);
      await loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Ошибка при удалении кампании');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      return;
    }
    try {
      await templatesApi.delete(workspaceSlug, templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Ошибка при удалении шаблона');
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    if (!confirm(`Отправить кампанию "${campaign.name}"?`)) {
      return;
    }
    try {
      // Для отправки нужны получатели - пока используем мок
      const recipientEmails = ['test@example.com'];
      await campaignsApi.send(workspaceSlug, campaign.id, recipientEmails);
      await loadCampaigns();
        toast.success('Кампания отправлена (мок)');
    } catch (error) {
      console.error('Error sending campaign:', error);
        toast.error('Ошибка при отправке кампании');
    }
  };

  const handleViewCampaign = async (campaign: Campaign) => {
    try {
      const response = await campaignsApi.get(workspaceSlug, campaign.id);
      if (response.success && response.data) {
        setSelectedCampaign(response.data.campaign);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Кампании</h1>
          <p className="text-gray-600 mt-1">Email и SMS рассылки</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenTemplateModal()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FileText size={18} />
            Создать шаблон
          </button>
          <button
            onClick={() => handleOpenCampaignModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Создать кампанию
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Кампании</h2>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <EmptyState
                icon={Mail}
                title="Email и SMS рассылки"
                description="Массово общайтесь с клиентами через email и SMS. Сначала создайте шаблон сообщения, затем используйте его в кампании для рассылки нескольким клиентам сразу."
                actionLabel="Создать первую кампанию"
                onAction={() => handleOpenCampaignModal()}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[campaign.status]}`}>
                            {STATUS_LABELS[campaign.status]}
                          </span>
                        </div>
                        {campaign.template && (
                          <p className="text-sm text-gray-600">Шаблон: {campaign.template.name}</p>
                        )}
                        {campaign._count && (
                          <p className="text-sm text-gray-500">
                            Отправлено сообщений: {campaign._count.messageLogs}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewCampaign(campaign)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Просмотр"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenCampaignModal(campaign)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Редактировать"
                        >
                          <Edit size={16} />
                        </button>
                        {campaign.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSendCampaign(campaign)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Отправить"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Шаблоны</h2>
              <button
                onClick={() => handleOpenTemplateModal()}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Создать шаблон"
              >
                <Plus size={18} />
              </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {templates.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Создайте шаблон"
                  description="Шаблоны - это готовые сообщения для рассылок. Создайте шаблон один раз, затем используйте его в разных кампаниях. Это экономит время и обеспечивает единый стиль общения."
                  actionLabel="Создать шаблон"
                  onAction={() => handleOpenTemplateModal()}
                />
              ) : (
                <div className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{template.type}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenTemplateModal(template)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCampaign ? 'Редактировать кампанию' : 'Создать кампанию'}
              </h2>
              <button
                onClick={handleCloseCampaignModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  id="campaignName"
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-1">
                  Шаблон
                </label>
                <select
                  id="templateId"
                  value={campaignData.templateId}
                  onChange={(e) => setCampaignData({ ...campaignData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите шаблон</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <select
                  id="status"
                  value={campaignData.status}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, status: e.target.value as Campaign['status'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="SCHEDULED">Запланирована</option>
                  <option value="RUNNING">Запущена</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELLED">Отменена</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Получатели *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Добавить
                  </button>
                  {clients.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddClientsAsRecipients}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Из клиентов
                    </button>
                  )}
                </div>
                {campaignData.recipientEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {campaignData.recipientEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(email)}
                          className="hover:text-blue-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {campaignData.recipientEmails.length === 0 && (
                  <p className="text-sm text-gray-500">Добавьте получателей для кампании</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCampaignModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={campaignData.recipientEmails.length === 0 || submittingCampaign}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submittingCampaign ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Сохранение...
                    </>
                  ) : (
                    editingCampaign ? 'Сохранить' : 'Создать'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}
              </h2>
              <button
                onClick={handleCloseTemplateModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  id="templateName"
                  type="text"
                  value={templateData.name}
                  onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип *
                </label>
                <select
                  id="templateType"
                  value={templateData.type}
                  onChange={(e) =>
                    setTemplateData({ ...templateData, type: e.target.value as 'EMAIL' | 'SMS' })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>

              {templateData.type === 'EMAIL' && (
                <div>
                  <label htmlFor="templateSubject" className="block text-sm font-medium text-gray-700 mb-1">
                    Тема письма
                  </label>
                  <input
                    id="templateSubject"
                    type="text"
                    value={templateData.subject}
                    onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="templateBody" className="block text-sm font-medium text-gray-700 mb-1">
                  Содержимое *
                </label>
                <textarea
                  id="templateBody"
                  value={templateData.body}
                  onChange={(e) => setTemplateData({ ...templateData, body: e.target.value })}
                  required
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={templateData.type === 'EMAIL' ? 'Текст письма...' : 'Текст SMS...'}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseTemplateModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submittingTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submittingTemplate ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Сохранение...
                    </>
                  ) : (
                    editingTemplate ? 'Сохранить' : 'Создать'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{selectedCampaign.name}</h2>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Логи отправки</h3>
                {selectedCampaign.messageLogs && selectedCampaign.messageLogs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCampaign.messageLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-md border ${
                          log.status === 'SENT'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{log.recipient}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(log.sentAt).toLocaleString('ru-RU')}
                            </p>
                            {log.error && <p className="text-sm text-red-600 mt-1">{log.error}</p>}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              log.status === 'SENT'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status === 'SENT' ? 'Отправлено' : 'Ошибка'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Нет логов отправки</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


