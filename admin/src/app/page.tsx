import Link from 'next/link';
import { Shield, Users, Building2, Activity, Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
          <Shield className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">VECTA Admin</h1>
        <p className="text-lg text-gray-600 mb-8">
          Платформенная административная панель для управления пользователями, workspace и аудитом системы
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Войти в админку
        </Link>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Users className="text-blue-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-2">Пользователи</h3>
            <p className="text-sm text-gray-600">Управление пользователями платформы, просмотр статистики</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Building2 className="text-green-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-2">Workspaces</h3>
            <p className="text-sm text-gray-600">Просмотр всех workspace и их статистики</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Activity className="text-purple-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-2">Audit Log</h3>
            <p className="text-sm text-gray-600">Просмотр всех действий в системе</p>
          </div>
        </div>
      </div>
    </div>
  );
}


