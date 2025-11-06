const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Rubric {
  id: string;
  nombre: string;
  descripcion?: string;
  escalaMinima: number;
  escalaMaxima: number;
  porcentaje: number;
  challengeId: string;
  createdAt: string;
}

class RubricService {
  async getByChallenge(challengeId: string): Promise<Rubric[]> {
    const response = await fetch(`${API_URL}/rubrics/challenge/${challengeId}`);

    if (!response.ok) {
      throw new Error('Error al obtener rúbricas del desafío');
    }

    return response.json();
  }
}

export const rubricService = new RubricService();
