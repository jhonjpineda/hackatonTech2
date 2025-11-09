import axiosInstance from '@/lib/axios';

export interface Judge {
  id: string;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  status: string;
  createdAt: string;
}

class JudgeService {
  async getAllJudges(token: string): Promise<Judge[]> {
    const response = await axiosInstance.get('/auth/judges', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}

export const judgeService = new JudgeService();
