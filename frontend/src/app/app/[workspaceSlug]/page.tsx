'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, dealsApi, tasksApi, dashboardApi, membersApi } from '@/lib/api';
import { Users, Briefcase, CheckSquare, TrendingUp, ArrowRight, AlertCircle, Clock, BarChart3, PieChart, User, Circle } from 'lucide-react';

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  
  const [stats, setStats] = useState({
    clients: 0,
    deals: 0,
    tasks: 0,
    revenue: 0,
  });
  const [attention, setAttention] = useState<{
    overdueTasks: any[];
    dealsWithoutTasks: any[];
  } | null>(null);
  const [dealsAnalytics, setDealsAnalytics] = useState<any>(null);
  const [tasksAnalytics, setTasksAnalytics] = useState<any>(null);
  const [myDashboard, setMyDashboard] = useState<any>(null);
  const [teamOverview, setTeamOverview] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [workspaceSlug]);

  const loadStats = async () => {
    try {
      // Получаем роль пользователя
      const memberRes = await membersApi.getMe(workspaceSlug);
      if (memberRes.success && memberRes.data) {
        setUserRole(memberRes.data.member.role);
      }

      const [clientsRes, dealsRes, tasksRes, attentionRes, dealsAnalyticsRes, tasksAnalyticsRes, myDashboardRes, teamOverviewRes] = await Promise.all([
        clientsApi.list(workspaceSlug),
        dealsApi.list(workspaceSlug),
        tasksApi.list(workspaceSlug),
        dashboardApi.getAttention(workspaceSlug),
        dashboardApi.getDealsAnalytics(workspaceSlug),
        dashboardApi.getTasksAnalytics(workspaceSlug),
        dashboardApi.getMy(workspaceSlug),
        // Загружаем обзор команды только для OWNER/ADMIN/MANAGER
        memberRes.success && memberRes.data && ['OWNER', 'ADMIN', 'MANAGER'].includes(memberRes.data.member.role)
          ? dashboardApi.getTeam(workspaceSlug)
          : Promise.resolve({ success: false, data: null }),
      ]);

      const clients = clientsRes.success ? clientsRes.data?.clients.length || 0 : 0;
      const deals = dealsRes.success ? dealsRes.data?.deals.length || 0 : 0;
      const tasks = tasksRes.success ? tasksRes.data?.tasks.length || 0 : 0;
      
      // Подсчет выручки из закрытых сделок
      const closedDeals = dealsRes.success
        ? dealsRes.data?.deals.filter((d) => d.stage === 'closed_won') || []
        : [];
      const revenue = closedDeals.reduce((sum, deal) => {
        const amount = deal.amount ? parseFloat(String(deal.amount)) : 0;
        return sum + amount;
      }, 0);

      setStats({ clients, deals, tasks, revenue });

      if (attentionRes.success && attentionRes.data) {
        setAttention(attentionRes.data);
      }
      if (dealsAnalyticsRes.success && dealsAnalyticsRes.data) {
        setDealsAnalytics(dealsAnalyticsRes.data);
      }
      if (tasksAnalyticsRes.success && tasksAnalyticsRes.data) {
        setTasksAnalytics(tasksAnalyticsRes.data);
      }
      if (myDashboardRes.success && myDashboardRes.data) {
        setMyDashboard(myDashboardRes.data);
      }
      if (teamOverviewRes.success && teamOverviewRes.data) {
        setTeamOverview(teamOverviewRes.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href={`/app/${workspaceSlug}/clients`}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Клиенты</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.clients}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Link>

        <Link
          href={`/app/${workspaceSlug}/deals`}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Сделки</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.deals}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Briefcase className="text-green-600" size={24} />
            </div>
          </div>
        </Link>

        <Link
          href={`/app/${workspaceSlug}/tasks`}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Задачи</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tasks}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <CheckSquare className="text-yellow-600" size={24} />
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Выручка</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(stats.revenue)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Attention Block */}
      {attention && (attention.overdueTasks.length > 0 || attention.dealsWithoutTasks.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-yellow-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Требует внимания</h2>
          </div>
          
          {attention.overdueTasks.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="text-red-500" size={16} />
                Просроченные задачи ({attention.overdueTasks.length})
              </h3>
              <div className="space-y-2">
                {attention.overdueTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/app/${workspaceSlug}/tasks`}
                    className="block p-3 bg-white rounded border border-yellow-200 hover:border-yellow-400 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.dueAt && (
                      <p className="text-xs text-red-600 mt-1">
                        Просрочено на {Math.floor((new Date().getTime() - new Date(task.dueAt).getTime()) / (1000 * 60 * 60 * 24))} дн.
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {attention.dealsWithoutTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Сделки без задач ({attention.dealsWithoutTasks.length})
              </h3>
              <div className="space-y-2">
                {attention.dealsWithoutTasks.slice(0, 5).map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/app/${workspaceSlug}/deals/${deal.id}`}
                    className="block p-3 bg-white rounded border border-yellow-200 hover:border-yellow-400 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {deal.client?.name || 'Без клиента'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Этап: {deal.stage}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Section */}
      {(dealsAnalytics || tasksAnalytics) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Deals Analytics */}
          {dealsAnalytics && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Аналитика по сделкам</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Всего сделок</span>
                    <span className="font-semibold">{dealsAnalytics.totalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Средняя сумма</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(dealsAnalytics.avgAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600">Закрыто успешно</span>
                    <span className="font-semibold text-green-600">{dealsAnalytics.closedWonCount}</span>
                  </div>
                </div>

                {/* Bar Chart - Deals by Stage */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Сделки по стадиям</h3>
                  <div className="space-y-2">
                    {Object.entries(dealsAnalytics.byStage).map(([stage, data]: [string, any]) => {
                      const maxCount = Math.max(...Object.values(dealsAnalytics.byStage).map((d: any) => d.count), 1);
                      const percentage = (data.count / maxCount) * 100;
                      const stageLabels: Record<string, string> = {
                        lead: 'Лид',
                        qualification: 'Квалификация',
                        proposal: 'Предложение',
                        negotiation: 'Переговоры',
                        closed_won: 'Закрыта (успех)',
                        closed_lost: 'Закрыта (неудача)',
                      };
                      return (
                        <div key={stage}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{stageLabels[stage] || stage}</span>
                            <span className="font-medium">{data.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Analytics */}
          {tasksAnalytics && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="text-yellow-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Аналитика по задачам</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Всего задач</span>
                    <span className="font-semibold">{tasksAnalytics.totalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Просрочено</span>
                    <span className="font-semibold text-red-600">{tasksAnalytics.overdueCount}</span>
                  </div>
                </div>

                {/* Donut Chart - Tasks by Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Задачи по статусам</h3>
                  <div className="space-y-2">
                    {Object.entries(tasksAnalytics.byStatus).map(([status, count]: [string, any]) => {
                      const total = tasksAnalytics.totalCount || 1;
                      const percentage = (count / total) * 100;
                      const statusLabels: Record<string, string> = {
                        TODO: 'К выполнению',
                        IN_PROGRESS: 'В работе',
                        DONE: 'Выполнена',
                        CANCELLED: 'Отменена',
                      };
                      const statusColors: Record<string, string> = {
                        TODO: 'bg-gray-400',
                        IN_PROGRESS: 'bg-yellow-500',
                        DONE: 'bg-green-500',
                        CANCELLED: 'bg-red-400',
                      };
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">{statusLabels[status] || status}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${statusColors[status] || 'bg-gray-400'} h-2 rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Dashboard Section */}
      {myDashboard && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Моя панель</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{myDashboard.myTasks}</p>
              <p className="text-sm text-gray-600 mt-1">Мои задачи</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{myDashboard.myDeals}</p>
              <p className="text-sm text-gray-600 mt-1">Мои сделки</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{myDashboard.overdueTasks}</p>
              <p className="text-sm text-gray-600 mt-1">Просрочено</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{myDashboard.todayTasks}</p>
              <p className="text-sm text-gray-600 mt-1">Сегодня</p>
            </div>
          </div>

          {myDashboard.overdueTasksList.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Просроченные задачи</h3>
              <div className="space-y-2">
                {myDashboard.overdueTasksList.map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/app/${workspaceSlug}/tasks`}
                    className="block p-2 bg-red-50 rounded border border-red-200 hover:border-red-400 transition-colors text-sm"
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {myDashboard.todayTasksList.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Задачи на сегодня</h3>
              <div className="space-y-2">
                {myDashboard.todayTasksList.map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/app/${workspaceSlug}/tasks`}
                    className="block p-2 bg-yellow-50 rounded border border-yellow-200 hover:border-yellow-400 transition-colors text-sm"
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Overview Section */}
      {teamOverview && teamOverview.team && teamOverview.team.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-purple-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Обзор команды</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamOverview.team.map((member: any) => (
              <div key={member.userId} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{member.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle
                      size={12}
                      className={
                        member.loadStatus === 'green'
                          ? 'text-green-500 fill-green-500'
                          : member.loadStatus === 'yellow'
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-red-500 fill-red-500'
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Задач всего</span>
                    <span className="font-medium">{member.tasks.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Выполнено</span>
                    <span className="font-medium text-green-600">{member.tasks.done}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Просрочено</span>
                    <span className={`font-medium ${member.tasks.overdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {member.tasks.overdue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Активных сделок</span>
                    <span className="font-medium">{member.activeDeals}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Section for New Users */}
      {stats.clients === 0 && stats.deals === 0 && stats.tasks === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-8 border border-blue-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Добро пожаловать в VECTA CRM!
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            Начните работу с добавления первого клиента. Это ваша база контактов - здесь вы храните информацию о людях и компаниях, с которыми работаете.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/app/${workspaceSlug}/clients`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Добавить клиента
              <ArrowRight size={18} />
            </Link>
            <p className="text-sm text-gray-600 self-center">
              Затем создайте сделку и назначьте задачу
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/app/${workspaceSlug}/clients`}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Клиенты</h3>
              <p className="text-sm text-gray-600 mb-4">Ваша база контактов</p>
              <span className="text-blue-600 text-sm font-medium group-hover:gap-2 inline-flex items-center gap-1">
                Перейти <ArrowRight size={16} />
              </span>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </Link>

        <Link
          href={`/app/${workspaceSlug}/deals`}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Сделки</h3>
              <p className="text-sm text-gray-600 mb-4">Воронка продаж</p>
              <span className="text-green-600 text-sm font-medium group-hover:gap-2 inline-flex items-center gap-1">
                Перейти <ArrowRight size={16} />
              </span>
            </div>
            <Briefcase className="text-green-600" size={32} />
          </div>
        </Link>

        <Link
          href={`/app/${workspaceSlug}/tasks`}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Задачи</h3>
              <p className="text-sm text-gray-600 mb-4">Контроль и напоминания</p>
              <span className="text-yellow-600 text-sm font-medium group-hover:gap-2 inline-flex items-center gap-1">
                Перейти <ArrowRight size={16} />
              </span>
            </div>
            <CheckSquare className="text-yellow-600" size={32} />
          </div>
        </Link>
      </div>
    </div>
  );
}

