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
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Важно для cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  return data as ApiResponse<T>;
}

// Auth API
export const authApi = {
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

// Platform Admin API
export interface PlatformUser {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
  createdAt: string;
  _count: {
    memberships: number;
    sessions: number;
  };
}

export interface PlatformWorkspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: {
    members: number;
    clients: number;
    deals: number;
    tasks: number;
  };
}

export interface PlatformAuditEvent {
  id: string;
  workspaceId: string | null;
  actorUserId: string;
  entityType: string;
  entityId: string | null;
  action: string;
  payloadJson: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const platformApi = {
  getUsers: async () => {
    return fetchApi<{ users: PlatformUser[] }>('/platform/users');
  },

  getWorkspaces: async () => {
    return fetchApi<{ workspaces: PlatformWorkspace[] }>('/platform/workspaces');
  },

  getAudit: async (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString();
    return fetchApi<{
      auditEvents: PlatformAuditEvent[];
      total: number;
      limit: number;
      offset: number;
    }>(`/platform/audit${query ? `?${query}` : ''}`);
  },
};


