export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  maxParticipantes?: number;
  maxEquipos?: number;
  activa: boolean;
  hackathonId: string;
  topicId?: string;
  topic?: {
    id: string;
    nombre: string;
    codigo: string;
  };
  hackathon?: {
    id: string;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const categoryService = {
  // Obtener categorías de un hackathon
  async getByHackathon(hackathonId: string, token: string): Promise<Category[]> {
    const response = await fetch(`${API_URL}/categories/hackathon/${hackathonId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las categorías');
    }

    return response.json();
  },

  // Obtener todas las categorías
  async getAll(token: string): Promise<Category[]> {
    const response = await fetch(`${API_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las categorías');
    }

    return response.json();
  },

  // Obtener una categoría por ID
  async getById(id: string, token: string): Promise<Category> {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener la categoría');
    }

    return response.json();
  },
};
