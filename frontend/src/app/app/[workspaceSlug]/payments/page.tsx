'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoicesApi, paymentsApi, Invoice, Payment, CreateInvoiceInput, CreatePaymentInput } from '@/lib/api';
import { authApi } from '@/lib/api';
import { Receipt, CreditCard, Plus, Edit, Trash2, Loader2, X, DollarSign } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function PaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState<CreateInvoiceInput>({
    number: '',
    amount: 0,
    status: 'DRAFT',
    dueAt: '',
  });
  const [paymentFormData, setPaymentFormData] = useState<CreatePaymentInput>({
    invoiceId: '',
    amount: 0,
    method: 'CARD',
    status: 'PENDING',
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, [workspaceSlug]);

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success) {
        router.push('/login');
        return;
      }
      await loadData();
    } catch (error) {
      router.push('/login');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, paymentsResponse] = await Promise.all([
        invoicesApi.list(workspaceSlug),
        paymentsApi.list(workspaceSlug),
      ]);
      if (invoicesResponse.success && invoicesResponse.data) {
        setInvoices(invoicesResponse.data.invoices);
      }
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data.payments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoiceModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setInvoiceFormData({
        number: invoice.number,
        amount: parseFloat(invoice.amount),
        status: invoice.status,
        dueAt: invoice.dueAt ? invoice.dueAt.split('T')[0] : '',
      });
    } else {
      setEditingInvoice(null);
      setInvoiceFormData({
        number: '',
        amount: 0,
        status: 'DRAFT',
        dueAt: '',
      });
    }
    setShowInvoiceModal(true);
  };

  const handleOpenPaymentModal = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentFormData({
        invoiceId: payment.invoiceId,
        amount: parseFloat(payment.amount),
        method: payment.method,
        status: payment.status,
      });
    } else {
      setEditingPayment(null);
      setPaymentFormData({
        invoiceId: invoices.length > 0 ? invoices[0].id : '',
        amount: 0,
        method: 'CARD',
        status: 'PENDING',
      });
    }
    setShowPaymentModal(true);
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setEditingInvoice(null);
    setInvoiceFormData({
      number: '',
      amount: 0,
      status: 'DRAFT',
      dueAt: '',
    });
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setEditingPayment(null);
    setPaymentFormData({
      invoiceId: '',
      amount: 0,
      method: 'CARD',
      status: 'PENDING',
    });
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await invoicesApi.update(workspaceSlug, editingInvoice.id, invoiceFormData);
      } else {
        await invoicesApi.create(workspaceSlug, invoiceFormData);
      }
      handleCloseInvoiceModal();
      await loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Ошибка при сохранении счёта');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await paymentsApi.update(workspaceSlug, editingPayment.id, paymentFormData);
      } else {
        await paymentsApi.create(workspaceSlug, paymentFormData);
      }
      handleClosePaymentModal();
      await loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Ошибка при сохранении платежа');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот счёт?')) {
      return;
    }
    try {
      await invoicesApi.delete(workspaceSlug, invoiceId);
      await loadData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Ошибка при удалении счёта');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот платеж?')) {
      return;
    }
    try {
      await paymentsApi.delete(workspaceSlug, paymentId);
      await loadData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Ошибка при удалении платежа');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'SENT':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Черновик',
      SENT: 'Отправлен',
      PAID: 'Оплачен',
      CANCELLED: 'Отменён',
      PENDING: 'Ожидает',
      COMPLETED: 'Завершён',
      FAILED: 'Ошибка',
    };
    return labels[status] || status;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CARD: 'Карта',
      BANK_TRANSFER: 'Банковский перевод',
      CASH: 'Наличные',
      OTHER: 'Другое',
    };
    return labels[method] || method;
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
              <h1 className="text-2xl font-bold text-gray-900">Платежи и счета</h1>
              <p className="text-sm text-gray-600 mt-1">Управление счетами и платежами</p>
            </div>
            <div className="flex gap-2">
              {activeTab === 'invoices' ? (
                <button
                  onClick={() => handleOpenInvoiceModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  Создать счёт
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPaymentModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  Добавить платеж
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Счета
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Платежи
            </button>
          </nav>
        </div>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                <Receipt className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет счетов</h3>
                <p className="text-gray-600 mb-4">Начните с создания первого счёта</p>
                <button
                  onClick={() => handleOpenInvoiceModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  Создать счёт
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Номер
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Срок оплаты
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-gray-400" />
                            {parseFloat(invoice.amount).toLocaleString('ru-RU', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString('ru-RU') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenInvoiceModal(invoice)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет платежей</h3>
                <p className="text-gray-600 mb-4">Начните с добавления первого платежа</p>
                <button
                  onClick={() => handleOpenPaymentModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  Добавить платеж
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Метод
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-gray-400" />
                            {parseFloat(payment.amount).toLocaleString('ru-RU', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getMethodLabel(payment.method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenPaymentModal(payment)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingInvoice ? 'Редактировать счёт' : 'Создать счёт'}
              </h2>
              <button onClick={handleCloseInvoiceModal} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер счёта</label>
                <input
                  type="text"
                  value={invoiceFormData.number}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сумма</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={invoiceFormData.amount}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select
                  value={invoiceFormData.status}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="SENT">Отправлен</option>
                  <option value="PAID">Оплачен</option>
                  <option value="CANCELLED">Отменён</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Срок оплаты</label>
                <input
                  type="date"
                  value={invoiceFormData.dueAt}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseInvoiceModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingInvoice ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPayment ? 'Редактировать платеж' : 'Добавить платеж'}
              </h2>
              <button onClick={handleClosePaymentModal} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Счёт</label>
                <select
                  value={paymentFormData.invoiceId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, invoiceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Выберите счёт</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.number} - {parseFloat(invoice.amount).toLocaleString('ru-RU')} ₽
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сумма</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Метод оплаты</label>
                <select
                  value={paymentFormData.method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CARD">Карта</option>
                  <option value="BANK_TRANSFER">Банковский перевод</option>
                  <option value="CASH">Наличные</option>
                  <option value="OTHER">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select
                  value={paymentFormData.status}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PENDING">Ожидает</option>
                  <option value="COMPLETED">Завершён</option>
                  <option value="FAILED">Ошибка</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingPayment ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


