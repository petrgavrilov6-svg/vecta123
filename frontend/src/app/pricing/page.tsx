'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              VECTA CRM
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Возможности
              </Link>
              <Link href="/pricing" className="text-blue-600 font-medium">
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Простые и прозрачные тарифы</h1>
          <p className="text-xl text-gray-600">Выберите план, который подходит вашему бизнесу</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">Бесплатно</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Для старта, чтобы попробовать</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">До 3 пользователей</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">До 50 клиентов</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Неограниченные сделки и задачи</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Базовые функции (Clients, Deals, Tasks, Chat)</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Попробовать бесплатно
            </Link>
          </div>

          {/* Team Plan */}
          <div className="border-2 border-blue-600 rounded-lg p-8 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Популярный
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Team</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">₽990</span>
              <span className="text-gray-600">/месяц</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Для растущего бизнеса, нужны рассылки</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">До 10 пользователей</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">До 500 клиентов</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Все функции Free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Campaigns (email/SMS рассылки)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Расширенная аналитика</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Начать пробный период
            </Link>
          </div>

          {/* Business Plan */}
          <div className="border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">₽2,990</span>
              <span className="text-gray-600">/месяц</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Для серьезного бизнеса, нужны все функции</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Неограниченно пользователей</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Неограниченно клиентов</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Все функции Team</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Integrations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Payments (счета и платежи)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-600" size={20} />
                <span className="text-gray-600">Приоритетная поддержка</span>
              </li>
            </ul>
            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Начать пробный период
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


