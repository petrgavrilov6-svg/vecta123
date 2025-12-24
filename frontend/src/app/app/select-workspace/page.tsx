'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Building2, Plus, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function SelectWorkspacePage() {
  const router = useRouter();
  const toast = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Проверяем авторизацию
      const meResponse = await authApi.me();
      if (!meResponse.success) {
        router.push('/login');
        return;
      }

      if (meResponse.data?.user) {
        setUser({ email: meResponse.data.user.email });
      }

      // TODO: Загрузить список workspace пользователя через API
      // Пока используем мок данные
      // В следующем этапе добавим эндпоинт GET /workspaces
      setWorkspaces([
        {
          id: '1',
          name: 'Тестовый Workspace',
          slug: 'test-workspace',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/login');
  };

  const handleSelectWorkspace = (slug: string) => {
    router.push(`/app/${slug}`);
  };

  const handleCreateWorkspace = () => {
    // TODO: Реализовать создание workspace через API
    // Пока используем мок - создаем workspace с slug на основе названия
    const workspaceName = prompt('Введите название workspace:');
    if (workspaceName && workspaceName.trim()) {
      const slug = workspaceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (slug) {
        toast.info('Workspace создан. Начните с добавления первого клиента!', 8000);
        router.push(`/app/${slug}`);
      } else {
        toast.warning('Название должно содержать буквы или цифры');
      }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {workspaces.length === 0 ? 'Создайте ваш первый workspace' : 'Выберите Workspace'}
            </h1>
            <p className="text-gray-600 mt-1">
              {workspaces.length === 0 
                ? 'Workspace - это ваше рабочее пространство. Здесь вы будете управлять клиентами, сделками и задачами.'
                : user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleSelectWorkspace(workspace.slug)}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-500 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{workspace.name}</h3>
                  <p className="text-sm text-gray-500">{workspace.slug}</p>
                </div>
              </div>
            </button>
          ))}

          {/* Create New Workspace */}
          <button
            onClick={handleCreateWorkspace}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Plus className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {workspaces.length === 0 ? 'Создать workspace' : 'Создать новый'}
                </h3>
                <p className="text-sm text-gray-500">
                  {workspaces.length === 0 
                    ? 'Начните работу с создания вашего первого workspace'
                    : 'Создать новый workspace'}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

