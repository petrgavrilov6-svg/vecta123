'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  MessageSquare,
  UsersRound,
  Settings,
  CreditCard,
  Zap,
  Building2,
  LogOut,
  Plus,
  User,
  Menu,
  X,
} from 'lucide-react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Deals', href: '/deals', icon: Briefcase },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Campaigns', href: '/campaigns', icon: Zap },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Members', href: '/members', icon: UsersRound },
  { name: 'Integrations', href: '/integrations', icon: Settings },
  { name: 'Payments', href: '/payments', icon: CreditCard },
];

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>(workspaceSlug);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.me();
      if (!response.success || !response.data?.user) {
        router.push('/login');
        return;
      }
      setUser({
        email: response.data.user.email,
        id: response.data.user.id,
      });
      // Форматируем workspace name
      setWorkspaceName(workspaceSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/login');
  };

  const getCurrentPath = () => {
    const path = pathname.replace(`/app/${workspaceSlug}`, '') || '/';
    return path;
  };

  const isActive = (href: string) => {
    const currentPath = getCurrentPath();
    if (href === '') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath.startsWith(href);
  };

  const quickActions = [
    {
      name: 'Клиент',
      href: `/app/${workspaceSlug}/clients?action=create`,
      icon: Users,
    },
    {
      name: 'Сделка',
      href: `/app/${workspaceSlug}/deals?action=create`,
      icon: Briefcase,
    },
    {
      name: 'Задача',
      href: `/app/${workspaceSlug}/tasks?action=create`,
      icon: CheckSquare,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 className="text-blue-600" size={20} />
              <span className="font-semibold text-gray-900">VECTA</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const href = `/app/${workspaceSlug}${item.href}`;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{workspaceName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Создать</span>
              </button>

              {showQuickActions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowQuickActions(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.name}
                          href={action.href}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowQuickActions(false)}
                        >
                          <Icon size={16} />
                          <span>{action.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="text-blue-600" size={18} />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Выйти"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

