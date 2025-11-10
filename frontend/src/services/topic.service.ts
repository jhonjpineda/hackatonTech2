const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Topic {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

class TopicService {
  async getAll(): Promise<Topic[]> {
    const response = await fetch(`${API_URL}/topics`);

    if (!response.ok) {
      throw new Error('Error al obtener temas');
    }

    return response.json();
  }

  async getAllActive(): Promise<Topic[]> {
    const response = await fetch(`${API_URL}/topics/active`);

    if (!response.ok) {
      throw new Error('Error al obtener temas activos');
    }

    return response.json();
  }

  async getById(id: string): Promise<Topic> {
    const response = await fetch(`${API_URL}/topics/${id}`);

    if (!response.ok) {
      throw new Error('Error al obtener tema');
    }

    return response.json();
  }
}

export const topicService = new TopicService();
