export interface Topic {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  icono?: string;
  colorHex?: string;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const topicsService = {
  // Obtener todos los topics
  async getAll(): Promise<Topic[]> {
    const response = await fetch(`${API_URL}/topics`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los temas');
    }

    return response.json();
  },

  // Obtener topics activos
  async getActive(): Promise<Topic[]> {
    const response = await fetch(`${API_URL}/topics/active`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los temas activos');
    }

    return response.json();
  },

  // Obtener un topic por ID
  async getById(id: string): Promise<Topic> {
    const response = await fetch(`${API_URL}/topics/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el tema');
    }

    return response.json();
  },

  // Obtener topic por código
  async getByCode(codigo: string): Promise<Topic> {
    const response = await fetch(`${API_URL}/topics/code/${codigo}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el tema por código');
    }

    return response.json();
  },
};
