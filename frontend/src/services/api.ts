import { useAuthStore } from '../store/authStore';

class ApiService {
  private baseURL = 'http://localhost:3001/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { accessToken, refreshAccessToken, logout } = useAuthStore.getState();
    
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && accessToken) {
        // Try to refresh the token
        try {
          await refreshAccessToken();
          const newToken = useAuthStore.getState().accessToken;
          
          // Retry the request with the new token
          const retryResponse = await fetch(url, {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          // If refresh fails, logout and redirect to login
          logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Chat endpoints
  async getUserChats() {
    return this.request('/chats');
  }

  async createChat(data: { name?: string; mode: string }) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatMessages(chatId: string, page = 1, limit = 50) {
    return this.request(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  // Intent endpoints
  async getUserIntents(filters: Record<string, string> = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/intents?${params}`);
  }

  async createIntent(data: any) {
    return this.request('/intents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Ailock endpoints
  async createAilockSession(data: any) {
    return this.request('/ailock/session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentSession() {
    return this.request('/ailock/session');
  }

  async getContextActions(mode?: string, location?: string) {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    if (location) params.append('location', location);
    
    return this.request(`/ailock/context?${params}`);
  }
}

export const apiService = new ApiService();