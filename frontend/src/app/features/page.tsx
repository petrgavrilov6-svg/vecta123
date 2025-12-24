'use client';

import Link from 'next/link';
import { Users, BarChart3, Zap, Shield, MessageSquare, FileText, CreditCard, Settings } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              VECTA CRM
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/features" className="text-blue-600 font-medium">
                Возможности
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
                Тарифы
              </Link>
              <Link href="/security" className="text-gray-700 hover:text-blue-600 transition-colors">
                Безопасность
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Войти
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Возможности VECTA CRM</h1>
          <p className="text-xl text-gray-600">Все инструменты для эффективного управления бизнесом</p>
        </div>

        <div className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-blue-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Управление клиентами</h2>
              <p className="text-lg text-gray-600 mb-4">
                Полная база данных клиентов с контактами, историей взаимодействий, заметками и тегами.
                Легко находите нужного клиента и отслеживайте все коммуникации.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Централизованная база клиентов
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  История всех взаимодействий
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Импорт и экспорт данных (CSV)
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
                <Users className="text-blue-600" size={64} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 order-2 md:order-1">
              <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center">
                <BarChart3 className="text-green-600" size={64} />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="text-green-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Воронка продаж</h2>
              <p className="text-lg text-gray-600 mb-4">
                Визуальная воронка продаж с Kanban-доской. Отслеживайте сделки на каждом этапе,
                от лида до закрытия. Анализируйте конверсию и оптимизируйте процесс продаж.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Kanban-доска для визуализации
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Отслеживание суммы сделок
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Связь сделок с клиентами
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-purple-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Задачи и напоминания</h2>
              <p className="text-lg text-gray-600 mb-4">
                Управляйте задачами команды, устанавливайте дедлайны и получайте напоминания.
                Связывайте задачи с клиентами и сделками для полного контекста.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Kanban-доска задач
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Напоминания о дедлайнах
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Связь с клиентами и сделками
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center">
                <Zap className="text-purple-600" size={64} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 order-2 md:order-1">
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 rounded flex items-center justify-center">
                <MessageSquare className="text-orange-600" size={64} />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="text-orange-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Корпоративный чат</h2>
              <p className="text-lg text-gray-600 mb-4">
                Встроенный чат для общения команды. Создавайте комнаты для проектов,
                отделов или отдельных обсуждений. Все сообщения сохраняются в истории.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Групповые и приватные комнаты
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  История сообщений
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Автообновление в реальном времени
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="text-indigo-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Кампании и шаблоны</h2>
              <p className="text-lg text-gray-600 mb-4">
                Создавайте email и SMS кампании с использованием шаблонов.
                Отслеживайте статус отправки и анализируйте эффективность.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Шаблоны сообщений
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Массовые рассылки
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Логи отправки
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-indigo-200 rounded flex items-center justify-center">
                <FileText className="text-indigo-600" size={64} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 order-2 md:order-1">
              <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200 rounded flex items-center justify-center">
                <Settings className="text-red-600" size={64} />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Settings className="text-red-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Интеграции и платежи</h2>
              <p className="text-lg text-gray-600 mb-4">
                Интегрируйтесь с внешними сервисами (Email, Telegram, VK, WhatsApp).
                Управляйте счетами и платежами прямо из системы.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Множество интеграций
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Управление счетами
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Отслеживание платежей
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


