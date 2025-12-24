'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { membersApi, Member, invitesApi, Invite, CreateInviteInput } from '@/lib/api';
import { authApi } from '@/lib/api';
import { Users, Plus, Trash2, Loader2, X, Mail, Shield, UserPlus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  AGENT: 'Агент',
  VIEWER: 'Наблюдатель',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  MANAGER: 'bg-green-100 text-green-800',
  AGENT: 'bg-yellow-100 text-yellow-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [formData, setFormData] = useState<CreateInviteInput>({
    email: '',
    role: 'VIEWER',
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, [workspaceSlug]);

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await authApi.me();
      if (!authResponse.success) {
        router.push('/login');
        return;
      }
      await loadData();
    } catch (error) {
      router.push('/login');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersResponse, invitesResponse] = await Promise.all([
        membersApi.list(workspaceSlug),
        invitesApi.list(workspaceSlug).catch(() => ({ success: false, data: { invites: [] } })),
      ]);

      if (membersResponse.success && membersResponse.data) {
        setMembers(membersResponse.data.members);
        // Находим роль текущего пользователя
        const authResponse = await authApi.me();
        if (authResponse.success && authResponse.data?.user) {
          const currentMember = membersResponse.data.members.find(
            (m) => m.userId === authResponse.data?.user.id
          );
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        }
      }

      if (invitesResponse.success && invitesResponse.data) {
        setInvites(invitesResponse.data.invites);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const handleOpenInviteModal = () => {
    setFormData({ email: '', role: 'VIEWER' });
    setShowInviteModal(true);
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setFormData({ email: '', role: 'VIEWER' });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invitesApi.create(workspaceSlug, formData);
      handleCloseInviteModal();
      await loadData();
        toast.success('Приглашение создано (мок отправка в консоль backend)');
    } catch (error: any) {
      console.error('Error creating invite:', error);
        toast.error(error?.error?.message || 'Ошибка при создании приглашения');
    }
  };

  const handleDeleteMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ${memberEmail} из workspace?`)) {
      return;
    }
    try {
      await membersApi.delete(workspaceSlug, memberId);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting member:', error);
        toast.error(error?.error?.message || 'Ошибка при удалении члена');
    }
  };

  const handleDeleteInvite = async (inviteId: string, inviteEmail: string) => {
    if (!confirm(`Вы уверены, что хотите отменить приглашение для ${inviteEmail}?`)) {
      return;
    }
    try {
      await invitesApi.delete(workspaceSlug, inviteId);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting invite:', error);
        toast.error(error?.error?.message || 'Ошибка при удалении приглашения');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Users className="text-blue-600" size={24} />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Члены команды</h1>
                <p className="text-sm text-gray-500">Управление членами workspace</p>
              </div>
            </div>
            {canManageMembers && (
              <button
                onClick={handleOpenInviteModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={18} />
                Пригласить
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Члены workspace</h2>
            <p className="text-sm text-gray-600 mt-1">Все пользователи с доступом к workspace</p>
          </div>
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{member.user.email}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Присоединился: {formatDate(member.createdAt)}
                    </p>
                  </div>
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => handleDeleteMember(member.id, member.user.email)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Удалить из workspace"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <div className="p-12 text-center text-gray-500">Нет членов workspace</div>
            )}
          </div>
        </div>

        {/* Invites Section */}
        {canManageMembers && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Активные приглашения</h2>
              <p className="text-sm text-gray-600 mt-1">Приглашения, ожидающие принятия</p>
            </div>
            <div className="divide-y divide-gray-200">
              {invites.map((invite) => (
                <div key={invite.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Mail className="text-yellow-600" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${ROLE_COLORS[invite.role]}`}>
                          {ROLE_LABELS[invite.role]}
                        </span>
                        {isExpired(invite.expiresAt) && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            Истекло
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Отправлено: {formatDate(invite.createdAt)} • Истекает: {formatDate(invite.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(invite.id, invite.email)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Отменить приглашение"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {invites.length === 0 && (
                <div className="p-12 text-center text-gray-500">Нет активных приглашений</div>
              )}
            </div>
          </div>
        )}

        {!canManageMembers && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Только OWNER и ADMIN могут управлять членами workspace
            </p>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Пригласить в workspace</h2>
              <button
                onClick={handleCloseInviteModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Роль *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as CreateInviteInput['role'] })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="VIEWER">Наблюдатель</option>
                  <option value="AGENT">Агент</option>
                  <option value="MANAGER">Менеджер</option>
                  <option value="ADMIN">Администратор</option>
                  <option value="OWNER">Владелец</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Выберите роль для нового члена workspace
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Отправить приглашение
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


