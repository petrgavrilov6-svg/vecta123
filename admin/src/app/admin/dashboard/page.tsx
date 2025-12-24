'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, platformApi, PlatformUser, PlatformWorkspace } from '@/lib/api';
import { Loader2, Users, Building2, Activity, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    workspaces: 0,
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success || !authResponse.data?.user?.isPlatformAdmin) {
        router.push('/login');
        return;
      }
      setUser({ email: authResponse.data.user.email });

      const [usersResponse, workspacesResponse] = await Promise.all([
        platformApi.getUsers(),
        platformApi.getWorkspaces(),
      ]);

      if (usersResponse.success && usersResponse.data) {
        setStats((prev) => ({ ...prev, users: usersResponse.data!.users.length }));
      }
      if (workspacesResponse.success && workspacesResponse.data) {
        setStats((prev) => ({ ...prev, workspaces: workspacesResponse.data!.workspaces.length }));
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">VECTA Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut size={18} />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Link href="/admin/dashboard" className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link href="/admin/users" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Пользователи
            </Link>
            <Link href="/admin/workspaces" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего workspace</p>
                <p className="text-2xl font-bold text-gray-900">{stats.workspaces}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="text-blue-600 mb-2" size={24} />
              <h3 className="font-medium text-gray-900">Управление пользователями</h3>
              <p className="text-sm text-gray-600 mt-1">Просмотр и управление пользователями платформы</p>
            </Link>

            <Link
              href="/admin/workspaces"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="text-green-600 mb-2" size={24} />
              <h3 className="font-medium text-gray-900">Управление workspace</h3>
              <p className="text-sm text-gray-600 mt-1">Просмотр всех workspace и их статистики</p>
            </Link>

            <Link
              href="/admin/audit"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="text-purple-600 mb-2" size={24} />
              <h3 className="font-medium text-gray-900">Audit Log</h3>
              <p className="text-sm text-gray-600 mt-1">Просмотр всех действий в системе</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


