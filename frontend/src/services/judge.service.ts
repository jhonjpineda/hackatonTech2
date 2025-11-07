import api from './api';

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
    const response = await api.get('/auth/judges', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}

export const judgeService = new JudgeService();
