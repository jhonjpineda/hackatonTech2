import axiosInstance from '@/lib/axios';

export interface Judge {
  id: string;
  usuario: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    documento: string;
  };
  especialidad?: string;
  experiencia?: string;
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
