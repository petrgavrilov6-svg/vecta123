'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { chatApi, ChatRoom, ChatMessage, CreateChatRoomInput, CreateMessageInput, authApi } from '@/lib/api';
import { MessageSquare, Plus, Loader2, Send, Hash, Users, User } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/contexts/ToastContext';

export default function ChatPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const toast = useToast();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState<CreateChatRoomInput>({
    name: '',
    type: 'GROUP',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadUserAndRooms();
  }, [workspaceSlug]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      // Автообновление сообщений каждые 3 секунды
      const interval = setInterval(() => {
        loadMessages(selectedRoom.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserAndRooms = async () => {
    try {
      const authResponse = await authApi.me();
      if (authResponse.success && authResponse.data?.user) {
        setCurrentUserId(authResponse.data.user.id);
      }
      await loadRooms();
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await chatApi.listRooms(workspaceSlug);
      if (response.success && response.data) {
        setRooms(response.data.rooms);
        if (response.data.rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(response.data.rooms[0]);
        }
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await chatApi.getMessages(workspaceSlug, roomId);
      if (response.success && response.data) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRoom || sending) return;

    try {
      setSending(true);
      await chatApi.sendMessage(workspaceSlug, selectedRoom.id, { content: messageText });
      setMessageText('');
      await loadMessages(selectedRoom.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await chatApi.createRoom(workspaceSlug, newRoomData);
      if (response.success && response.data) {
        setShowRoomModal(false);
        setNewRoomData({ name: '', type: 'GROUP' });
        await loadRooms();
        if (response.data.room) {
          setSelectedRoom(response.data.room);
        }
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Ошибка при создании комнаты');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'DIRECT':
        return <User size={18} />;
      case 'GROUP':
        return <Users size={18} />;
      case 'CHANNEL':
        return <Hash size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Rooms List */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Комнаты</h2>
            <button
              onClick={() => setShowRoomModal(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Создать комнату"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={MessageSquare}
                title="Создайте комнату для общения"
                description="Внутренний чат для вашей команды. Создайте групповой чат для обсуждений, канал для объявлений или личный диалог для приватных разговоров."
                actionLabel="Создать комнату"
                onAction={() => setShowRoomModal(true)}
              />
            </div>
          ) : (
            <>
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-600">{getRoomIcon(room.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{room.name}</p>
                      <p className="text-xs text-gray-500">
                        {room._count?.messages || 0} сообщений
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedRoom && rooms.length > 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium">Выберите комнату для общения</p>
            </div>
          </div>
        ) : selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-2">
                {getRoomIcon(selectedRoom.type)}
                <h3 className="font-semibold text-gray-900">{selectedRoom.name}</h3>
                <span className="text-xs text-gray-500">({selectedRoom.type})</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.userId === currentUserId;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showDate =
                  !prevMessage ||
                  new Date(message.createdAt).toDateString() !==
                    new Date(prevMessage.createdAt).toDateString();

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatDate(message.createdAt)}
                      </div>
                    )}
                    <div
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Нет сообщений. Начните общение!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                  {sending ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Выберите комнату или создайте новую</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Создать комнату</h2>
            </div>
            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomData.name}
                  onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип *
                </label>
                <select
                  id="roomType"
                  value={newRoomData.type}
                  onChange={(e) =>
                    setNewRoomData({ ...newRoomData, type: e.target.value as CreateChatRoomInput['type'] })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GROUP">Группа</option>
                  <option value="CHANNEL">Канал</option>
                  <option value="DIRECT">Личный</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


