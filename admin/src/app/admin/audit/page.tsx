'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, platformApi, PlatformAuditEvent } from '@/lib/api';
import { Loader2, Activity, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auditEvents, setAuditEvents] = useState<PlatformAuditEvent[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    checkAuthAndLoadAudit();
  }, []);

  const checkAuthAndLoadAudit = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success || !authResponse.data?.user?.isPlatformAdmin) {
        router.push('/login');
        return;
      }
      await loadAudit();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    try {
      const response = await platformApi.getAudit(100, 0);
      if (response.success && response.data) {
        setAuditEvents(response.data.auditEvents);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Error loading audit:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Link href="/admin/dashboard" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/users" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Пользователи
            </Link>
            <Link href="/admin/workspaces" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Workspaces
            </Link>
            <Link href="/admin/audit" className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              Audit Log
            </Link>
            <Link href="/admin/settings" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Настройки
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 text-sm text-gray-600">
          Всего записей: {total} (показано: {auditEvents.length})
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сущность
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.actor.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.workspace ? event.workspace.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      event.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                      event.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      event.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {event.entityType}
                    {event.entityId && ` (${event.entityId.substring(0, 8)}...)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}


