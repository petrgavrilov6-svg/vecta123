const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Важно для cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Проверяем, что ответ успешный
    if (!response.ok && !response.headers.get('content-type')?.includes('application/json')) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Ошибка подключения к серверу: ${response.status} ${response.statusText}`,
        },
      };
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    // Обработка ошибок сети (сервер недоступен, CORS, и т.д.)
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Ошибка подключения к серверу. Убедитесь, что backend запущен на порту 4000.',
      },
    };
  }
}

// Auth API
export const authApi = {
  register: async (email: string, password: string) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  me: async () => {
    return fetchApi<{ user: { id: string; email: string; isPlatformAdmin: boolean; createdAt: string } }>('/auth/me');
  },
};

// Clients API
export const clientsApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ clients: Client[] }>(`/workspaces/${workspaceSlug}/clients`);
  },

  get: async (workspaceSlug: string, clientId: string) => {
    return fetchApi<{ client: Client }>(`/workspaces/${workspaceSlug}/clients/${clientId}`);
  },

  create: async (workspaceSlug: string, data: CreateClientInput) => {
    return fetchApi<{ client: Client }>(`/workspaces/${workspaceSlug}/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, clientId: string, data: UpdateClientInput) => {
    return fetchApi<{ client: Client }>(`/workspaces/${workspaceSlug}/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, clientId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  timeline: async (workspaceSlug: string, clientId: string) => {
    return fetchApi<{ events: TimelineEvent[] }>(
      `/workspaces/${workspaceSlug}/clients/${clientId}/timeline`
    );
  },

  export: async (workspaceSlug: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const url = `${API_URL}/workspaces/${workspaceSlug}/clients/export`;
    const response = await fetch(url, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Ошибка при экспорте');
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `clients_${workspaceSlug}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  import: async (workspaceSlug: string, csvText: string) => {
    return fetchApi<{ imported: number; failed: number; errors: string[] }>(
      `/workspaces/${workspaceSlug}/clients/import`,
      {
        method: 'POST',
        body: JSON.stringify({ csvText }),
      }
    );
  },
};

// Types
export interface Client {
  id: string;
  workspaceId: string;
  assignedToUserId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  deals?: any[];
  tasks?: any[];
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string;
  assignedToUserId?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string;
  assignedToUserId?: string;
}

// Deals API
export const dealsApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ deals: Deal[] }>(`/workspaces/${workspaceSlug}/deals`);
  },

  get: async (workspaceSlug: string, dealId: string) => {
    return fetchApi<{ deal: Deal }>(`/workspaces/${workspaceSlug}/deals/${dealId}`);
  },

  create: async (workspaceSlug: string, data: CreateDealInput) => {
    return fetchApi<{ deal: Deal }>(`/workspaces/${workspaceSlug}/deals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, dealId: string, data: UpdateDealInput) => {
    return fetchApi<{ deal: Deal }>(`/workspaces/${workspaceSlug}/deals/${dealId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, dealId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/deals/${dealId}`, {
      method: 'DELETE',
    });
  },

  timeline: async (workspaceSlug: string, dealId: string) => {
    return fetchApi<{ events: TimelineEvent[] }>(`/workspaces/${workspaceSlug}/deals/${dealId}/timeline`);
  },

  getChecklist: async (workspaceSlug: string, dealId: string) => {
    return fetchApi<{ items: DealChecklistItem[] }>(`/workspaces/${workspaceSlug}/deals/${dealId}/checklist`);
  },

  updateChecklistItem: async (workspaceSlug: string, dealId: string, data: UpdateChecklistItemInput) => {
    return fetchApi<{
      item: DealChecklistItem;
      checklistComplete?: boolean;
      completedCount?: number;
      totalCount?: number;
    }>(`/workspaces/${workspaceSlug}/deals/${dealId}/checklist`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Deal Types
export interface Deal {
  id: string;
  workspaceId: string;
  clientId: string | null;
  stage: string;
  amount: string | null;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
  };
  tasks?: any[];
}

export interface CreateDealInput {
  clientId?: string;
  stage: string;
  amount?: number;
  assignedToUserId?: string;
}

export interface UpdateDealInput {
  clientId?: string;
  stage?: string;
  amount?: number;
  assignedToUserId?: string;
}

// Tasks API
export const tasksApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ tasks: Task[] }>(`/workspaces/${workspaceSlug}/tasks`);
  },

  get: async (workspaceSlug: string, taskId: string) => {
    return fetchApi<{ task: Task }>(`/workspaces/${workspaceSlug}/tasks/${taskId}`);
  },

  create: async (workspaceSlug: string, data: CreateTaskInput) => {
    return fetchApi<{ task: Task }>(`/workspaces/${workspaceSlug}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, taskId: string, data: UpdateTaskInput) => {
    return fetchApi<{ task: Task }>(`/workspaces/${workspaceSlug}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, taskId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};

// Task Types
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  assignedToUserId: string | null;
  relatedClientId: string | null;
  relatedDealId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
  };
  deal?: {
    id: string;
    stage: string;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueAt?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  assignedToUserId?: string;
  relatedClientId?: string;
  relatedDealId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueAt?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  assignedToUserId?: string;
  relatedClientId?: string;
  relatedDealId?: string;
}

// Timeline Types
export interface TimelineEvent {
  id: string;
  workspaceId: string | null;
  actorUserId: string;
  entityType: string;
  entityId: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK' | 'UNCHECK';
  payloadJson: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
  };
}

// Deal Checklist Types
export interface DealChecklistItem {
  id: string;
  dealId: string;
  stage: string;
  title: string;
  completed: boolean;
  completedByUserId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedBy?: {
    id: string;
    email: string;
  } | null;
}

export interface UpdateChecklistItemInput {
  itemTitle: string;
  completed: boolean;
}

// Members API
export const membersApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ members: Member[] }>(`/workspaces/${workspaceSlug}/members`);
  },

  getCurrent: async (workspaceSlug: string) => {
    return fetchApi<{ member: { id: string; role: string } }>(`/workspaces/${workspaceSlug}/members/me`);
  },

  delete: async (workspaceSlug: string, memberId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/members/${memberId}`, {
      method: 'DELETE',
    });
  },
};

// Invites API
export const invitesApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ invites: Invite[] }>(`/workspaces/${workspaceSlug}/members/invites`);
  },

  create: async (workspaceSlug: string, data: CreateInviteInput) => {
    return fetchApi<{ invite: Invite }>(`/workspaces/${workspaceSlug}/members/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, inviteId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/members/invites/${inviteId}`, {
      method: 'DELETE',
    });
  },
};

// Member Types
export interface Member {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';
  createdAt: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

export interface Invite {
  id: string;
  workspaceId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateInviteInput {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';
}

// Chat API
export const chatApi = {
  listRooms: async (workspaceSlug: string) => {
    return fetchApi<{ rooms: ChatRoom[] }>(`/workspaces/${workspaceSlug}/chat/rooms`);
  },

  createRoom: async (workspaceSlug: string, data: CreateChatRoomInput) => {
    return fetchApi<{ room: ChatRoom }>(`/workspaces/${workspaceSlug}/chat/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMessages: async (workspaceSlug: string, roomId: string) => {
    return fetchApi<{ messages: ChatMessage[] }>(`/workspaces/${workspaceSlug}/chat/rooms/${roomId}/messages`);
  },

  sendMessage: async (workspaceSlug: string, roomId: string, data: CreateMessageInput) => {
    return fetchApi<{ message: ChatMessage }>(`/workspaces/${workspaceSlug}/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Chat Types
export interface ChatRoom {
  id: string;
  workspaceId: string;
  name: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  createdAt: string;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface CreateChatRoomInput {
  name: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
}

export interface CreateMessageInput {
  content: string;
}

// Templates API
export const templatesApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ templates: Template[] }>(`/workspaces/${workspaceSlug}/campaigns/templates`);
  },

  create: async (workspaceSlug: string, data: CreateTemplateInput) => {
    return fetchApi<{ template: Template }>(`/workspaces/${workspaceSlug}/campaigns/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, templateId: string, data: UpdateTemplateInput) => {
    return fetchApi<{ template: Template }>(`/workspaces/${workspaceSlug}/campaigns/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, templateId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/campaigns/templates/${templateId}`, {
      method: 'DELETE',
    });
  },
};

// Campaigns API
export const campaignsApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ campaigns: Campaign[] }>(`/workspaces/${workspaceSlug}/campaigns`);
  },

  get: async (workspaceSlug: string, campaignId: string) => {
    return fetchApi<{ campaign: Campaign }>(`/workspaces/${workspaceSlug}/campaigns/${campaignId}`);
  },

  create: async (workspaceSlug: string, data: CreateCampaignInput) => {
    return fetchApi<{ campaign: Campaign }>(`/workspaces/${workspaceSlug}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, campaignId: string, data: UpdateCampaignInput) => {
    return fetchApi<{ campaign: Campaign }>(`/workspaces/${workspaceSlug}/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, campaignId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  },

  send: async (workspaceSlug: string, campaignId: string, recipientEmails: string[]) => {
    return fetchApi(`/workspaces/${workspaceSlug}/campaigns/${campaignId}/send`, {
      method: 'POST',
      body: JSON.stringify({ recipientEmails }),
    });
  },
};

// Template Types
export interface Template {
  id: string;
  workspaceId: string;
  name: string;
  subject: string | null;
  body: string;
  type: 'EMAIL' | 'SMS';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  subject?: string;
  body: string;
  type: 'EMAIL' | 'SMS';
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  body?: string;
  type?: 'EMAIL' | 'SMS';
}

// Campaign Types
export interface Campaign {
  id: string;
  workspaceId: string;
  templateId: string | null;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: {
    id: string;
    name: string;
    type: string;
  };
  _count?: {
    messageLogs: number;
  };
  messageLogs?: MessageLog[];
}

export interface MessageLog {
  id: string;
  campaignId: string | null;
  recipient: string;
  status: 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt: string;
  error: string | null;
}

export interface CreateCampaignInput {
  name: string;
  templateId?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  recipientEmails: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  templateId?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  recipientEmails?: string[];
}

// Integration types and API
export interface Integration {
  id: string;
  workspaceId: string;
  type: 'EMAIL' | 'TELEGRAM' | 'VK' | 'WHATSAPP';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  dataJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationInput {
  type: 'EMAIL' | 'TELEGRAM' | 'VK' | 'WHATSAPP';
  status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  dataJson?: string;
}

export interface UpdateIntegrationInput extends Partial<CreateIntegrationInput> {}

export const integrationsApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ integrations: Integration[] }>(`/workspaces/${workspaceSlug}/integrations`);
  },

  get: async (workspaceSlug: string, integrationId: string) => {
    return fetchApi<{ integration: Integration }>(`/workspaces/${workspaceSlug}/integrations/${integrationId}`);
  },

  create: async (workspaceSlug: string, data: CreateIntegrationInput) => {
    return fetchApi<{ integration: Integration }>(`/workspaces/${workspaceSlug}/integrations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, integrationId: string, data: UpdateIntegrationInput) => {
    return fetchApi<{ integration: Integration }>(`/workspaces/${workspaceSlug}/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, integrationId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/integrations/${integrationId}`, {
      method: 'DELETE',
    });
  },
};

// Invoice types and API
export interface Invoice {
  id: string;
  workspaceId: string;
  number: string;
  amount: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
}

export interface CreateInvoiceInput {
  number: string;
  amount: number;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  dueAt?: string;
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {}

export const invoicesApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ invoices: Invoice[] }>(`/workspaces/${workspaceSlug}/payments/invoices`);
  },

  get: async (workspaceSlug: string, invoiceId: string) => {
    return fetchApi<{ invoice: Invoice }>(`/workspaces/${workspaceSlug}/payments/invoices/${invoiceId}`);
  },

  create: async (workspaceSlug: string, data: CreateInvoiceInput) => {
    return fetchApi<{ invoice: Invoice }>(`/workspaces/${workspaceSlug}/payments/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, invoiceId: string, data: UpdateInvoiceInput) => {
    return fetchApi<{ invoice: Invoice }>(`/workspaces/${workspaceSlug}/payments/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, invoiceId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/payments/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  },
};

// Payment types and API
export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  method: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  externalId: string | null;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  externalId?: string;
  metadataJson?: string;
}

export interface UpdatePaymentInput extends Partial<CreatePaymentInput> {}

// Dashboard API
export const dashboardApi = {
  getAttention: async (workspaceSlug: string) => {
    return fetchApi<{
      overdueTasks: Task[];
      dealsWithoutTasks: Array<{
        id: string;
        stage: string;
        client: { id: string; name: string } | null;
      }>;
    }>(`/workspaces/${workspaceSlug}/dashboard/attention`);
  },
  getDealsAnalytics: async (workspaceSlug: string) => {
    return fetchApi<{
      byStage: Record<string, { count: number; totalAmount: number }>;
      totalCount: number;
      totalAmount: number;
      avgAmount: number;
      closedWonCount: number;
      closedLostCount: number;
      closedWonAmount: number;
    }>(`/workspaces/${workspaceSlug}/dashboard/analytics/deals`);
  },
  getTasksAnalytics: async (workspaceSlug: string) => {
    return fetchApi<{
      byStatus: Record<string, number>;
      overdueCount: number;
      byUser: Record<string, { total: number; overdue: number; done: number }>;
      totalCount: number;
    }>(`/workspaces/${workspaceSlug}/dashboard/analytics/tasks`);
  },
  getMy: async (workspaceSlug: string) => {
    return fetchApi<{
      myTasks: number;
      myDeals: number;
      overdueTasks: number;
      todayTasks: number;
      overdueTasksList: any[];
      todayTasksList: any[];
      myDealsList: any[];
    }>(`/workspaces/${workspaceSlug}/dashboard/my`);
  },
  getTeam: async (workspaceSlug: string) => {
    return fetchApi<{
      team: Array<{
        userId: string;
        email: string;
        role: string;
        tasks: { total: number; done: number; overdue: number };
        activeDeals: number;
        loadStatus: 'green' | 'yellow' | 'red';
      }>;
    }>(`/workspaces/${workspaceSlug}/dashboard/team`);
  },
};

export const paymentsApi = {
  list: async (workspaceSlug: string) => {
    return fetchApi<{ payments: Payment[] }>(`/workspaces/${workspaceSlug}/payments`);
  },

  get: async (workspaceSlug: string, paymentId: string) => {
    return fetchApi<{ payment: Payment }>(`/workspaces/${workspaceSlug}/payments/${paymentId}`);
  },

  create: async (workspaceSlug: string, data: CreatePaymentInput) => {
    return fetchApi<{ payment: Payment }>(`/workspaces/${workspaceSlug}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (workspaceSlug: string, paymentId: string, data: UpdatePaymentInput) => {
    return fetchApi<{ payment: Payment }>(`/workspaces/${workspaceSlug}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceSlug: string, paymentId: string) => {
    return fetchApi(`/workspaces/${workspaceSlug}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  },
};

