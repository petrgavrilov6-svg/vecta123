'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Loader2, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success || !authResponse.data?.user?.isPlatformAdmin) {
        router.push('/login');
        return;
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
            <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
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
            <Link href="/admin/audit" className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors">
              Audit Log
            </Link>
            <Link href="/admin/settings" className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              Настройки
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Настройки платформы</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Настройки платформы будут доступны в будущих версиях.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


