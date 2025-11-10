import axiosInstance from '@/lib/axios';

export interface User {
  id: string;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  role: 'CAMPISTA' | 'JUEZ' | 'ORGANIZADOR';
  status: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

class UserService {
  async getAll(token: string): Promise<User[]> {
    const response = await axiosInstance.get('/auth/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async updateRole(userId: string, role: string, token: string): Promise<{ message: string; user: User }> {
    const response = await axiosInstance.put(
      `/auth/users/${userId}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  async delete(userId: string, token: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/auth/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}

export const userService = new UserService();
