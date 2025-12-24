'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Server, Key, FileCheck } from 'lucide-react';

export default function SecurityPage() {
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
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
                Тарифы
              </Link>
              <Link href="/security" className="text-blue-600 font-medium">
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Безопасность данных</h1>
          <p className="text-xl text-gray-600">Ваши данные под надежной защитой</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Шифрование данных</h3>
            <p className="text-gray-600">
              Все данные передаются и хранятся в зашифрованном виде с использованием современных алгоритмов шифрования.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Lock className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Контроль доступа</h3>
            <p className="text-gray-600">
              Многоуровневая система ролей и прав доступа. Каждый пользователь видит только то, что ему разрешено.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Audit Log</h3>
            <p className="text-gray-600">
              Полное логирование всех действий в системе. Вы всегда знаете, кто и что изменил в ваших данных.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Server className="text-orange-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Надежная инфраструктура</h3>
            <p className="text-gray-600">
              Данные хранятся на защищенных серверах с регулярным резервным копированием и мониторингом.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Key className="text-red-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Безопасная аутентификация</h3>
            <p className="text-gray-600">
              Пароли хранятся в хешированном виде. Сессии защищены и имеют ограниченный срок действия.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Соответствие стандартам</h3>
            <p className="text-gray-600">
              Мы соблюдаем все требования по защите персональных данных и регулярно проходим аудит безопасности.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Мультитенантность</h2>
          <p className="text-lg text-gray-700 mb-4">
            Каждый workspace полностью изолирован от других. Данные одного клиента никогда не смешиваются
            с данными другого. Это обеспечивает максимальный уровень безопасности и конфиденциальности.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">✓</span>
              Полная изоляция данных между workspace
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">✓</span>
              Контроль доступа на уровне workspace
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">✓</span>
              Резервное копирование для каждого workspace
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


