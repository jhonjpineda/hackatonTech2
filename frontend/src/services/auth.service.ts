import axiosInstance from '@/lib/axios';

export interface LoginCredentials {
  documento: string;
  password: string;
}

export interface RegisterData {
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface Topic {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
}

export interface User {
  id: string;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  role: 'CAMPISTA' | 'JUEZ' | 'ORGANIZADOR';
  status: string;
  telefono?: string;
  mustChangePassword?: boolean;
  interestTopics?: Topic[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', data);

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await axiosInstance.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const response = await axiosInstance.post<{ token: string }>('/auth/refresh', {
        refreshToken,
      });

      localStorage.setItem('token', response.data.token);
      return response.data.token;
    } catch (error) {
      return null;
    }
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  async createJudge(judgeData: {
    documento: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
  }): Promise<{ user: User; temporaryPassword: string }> {
    const response = await axiosInstance.post('/auth/create-judge', judgeData);
    return response.data;
  }

  async getAllJudges(): Promise<User[]> {
    const response = await axiosInstance.get('/auth/judges');
    return response.data;
  }

  async updateProfile(updateData: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    interestTopicIds?: string[];
  }): Promise<User> {
    const response = await axiosInstance.put('/auth/profile', updateData);

    // Actualizar el usuario en localStorage
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  }

  async removeInterestTopic(topicId: string): Promise<User> {
    const response = await axiosInstance.delete(`/auth/profile/topics/${topicId}`);

    // Actualizar el usuario en localStorage
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  }

  async clearAllTopics(): Promise<{ message: string; user: User }> {
    const response = await axiosInstance.delete('/auth/profile/topics');

    // Actualizar el usuario en localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }

  async changePassword(currentPassword: string | undefined, newPassword: string): Promise<{ message: string }> {
    const payload: any = { newPassword };

    // Solo incluir currentPassword si está definido
    if (currentPassword) {
      payload.currentPassword = currentPassword;
    }

    const response = await axiosInstance.put('/auth/change-password', payload);
    return response.data;
  }
}

export const authService = new AuthService();
