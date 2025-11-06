import { Challenge, CreateChallengeDto, UpdateChallengeDto } from '@/types/challenge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const challengeService = {
  // Obtener todos los desafíos
  async getAll(token: string): Promise<Challenge[]> {
    const response = await fetch(`${API_URL}/challenges`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los desafíos');
    }

    return response.json();
  },

  // Obtener desafíos por categoría
  async getByCategory(categoryId: string): Promise<Challenge[]> {
    const response = await fetch(`${API_URL}/challenges/category/${categoryId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los desafíos de la categoría');
    }

    return response.json();
  },

  // Obtener un desafío por ID
  async getById(id: string): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el desafío');
    }

    return response.json();
  },

  // Crear un desafío (solo organizadores)
  async create(data: CreateChallengeDto, token: string): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el desafío');
    }

    return response.json();
  },

  // Actualizar un desafío (solo el organizador)
  async update(id: string, data: UpdateChallengeDto, token: string): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el desafío');
    }

    return response.json();
  },

  // Eliminar un desafío (solo el organizador)
  async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el desafío');
    }
  },

  // Publicar un desafío
  async publish(id: string, token: string): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges/${id}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al publicar el desafío');
    }

    return response.json();
  },

  // Cerrar un desafío
  async close(id: string, token: string): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges/${id}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cerrar el desafío');
    }

    return response.json();
  },
};
