'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, platformApi, PlatformWorkspace } from '@/lib/api';
import { Loader2, Building2, LogOut, Users, Briefcase, CheckSquare, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);

  useEffect(() => {
    checkAuthAndLoadWorkspaces();
  }, []);

  const checkAuthAndLoadWorkspaces = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success || !authResponse.data?.user?.isPlatformAdmin) {
        router.push('/login');
        return;
      }
      await loadWorkspaces();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    try {
      const response = await platformApi.getWorkspaces();
      if (response.success && response.data) {
        setWorkspaces(response.data.workspaces);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
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
            <Link href="/admin/workspaces" className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              Workspaces
            </Link>
            <Link href="/admin/audit" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Audit Log
            </Link>
            <Link href="/admin/settings" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Настройки
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="text-blue-600" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
                  <p className="text-sm text-gray-500">/{workspace.slug}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>Членов: {workspace._count.members}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>Клиентов: {workspace._count.clients}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase size={16} />
                  <span>Сделок: {workspace._count.deals}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckSquare size={16} />
                  <span>Задач: {workspace._count.tasks}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                Создан: {new Date(workspace.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


