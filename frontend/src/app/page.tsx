'use client';

import Link from 'next/link';
import { Check, ArrowRight, Shield, Zap, Users, BarChart3, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">VECTA CRM</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-gray-700 hover:text-blue-600 transition-colors">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Простая CRM для малого бизнеса
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Управляйте клиентами и сделками без лишней сложности. 
            За 10 минут вы начнете работать, а не изучать инструкции.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg font-medium"
            >
              Начать бесплатно
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/features"
              className="px-8 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-lg font-medium"
            >
              Узнать больше
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Какую проблему решает VECTA CRM</h2>
            <div className="max-w-3xl mx-auto space-y-4 text-lg text-gray-700">
              <p>
                <strong>Устали от Excel и потерянных контактов?</strong> Контакты разбросаны по разным файлам, 
                сложно найти нужную информацию, легко что-то забыть.
              </p>
              <p>
                <strong>Существующие CRM слишком сложные?</strong> Нужны недели на изучение, 
                сотни функций, которые не используются, перегруженный интерфейс.
              </p>
              <p className="text-xl font-semibold text-blue-600 mt-6">
                VECTA CRM решает это - простая система, которая работает из коробки. 
                За 10 минут вы начнете работать, а не изучать инструкции.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Как это работает</h2>
            <p className="text-xl text-gray-600">Три простых шага к порядку в работе с клиентами</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Добавьте клиентов</h3>
              <p className="text-gray-600">
                Ваша база контактов в одном месте. Все клиенты, их контакты и история взаимодействий.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Создайте сделки</h3>
              <p className="text-gray-600">
                Визуальная воронка показывает прогресс каждой сделки - от первого контакта до закрытия.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Назначьте задачи</h3>
              <p className="text-gray-600">
                Ничего не забудете, все под контролем. Задачи напомнят о важных действиях и сроках.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Что внутри</h2>
            <p className="text-xl text-gray-600">Все необходимое для работы с клиентами, без лишнего</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление клиентами</h3>
              <p className="text-gray-600 text-sm">База контактов, история взаимодействий, импорт из CSV</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Воронка продаж</h3>
              <p className="text-gray-600 text-sm">Визуальная воронка, отслеживание этапов, суммы сделок</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Задачи и напоминания</h3>
              <p className="text-gray-600 text-sm">Контроль сроков, связь с клиентами и сделками</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Внутренний чат</h3>
              <p className="text-gray-600 text-sm">Общение с командой, групповые чаты и каналы</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email/SMS рассылки</h3>
              <p className="text-gray-600 text-sm">Массовые рассылки клиентам (в платных тарифах)</p>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Командная работа</h3>
              <p className="text-gray-600 text-sm">Управление доступом, роли, приглашения</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Готовы начать?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Присоединяйтесь к тысячам компаний, которые уже используют VECTA CRM
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
          >
            Начать бесплатно
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">VECTA CRM</h3>
              <p className="text-sm">Современная CRM платформа для вашего бизнеса</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Возможности
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Тарифы
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Безопасность</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/security" className="hover:text-white transition-colors">
                    Безопасность
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Аккаунт</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Войти
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2024 VECTA CRM. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

