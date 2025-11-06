import {
  Hackathon,
  CreateHackathonDto,
  UpdateHackathonDto,
  HackathonStatus,
} from '@/types/hackathon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const hackathonService = {
  // Obtener todos los hackathones
  async getAll(filters?: {
    estado?: HackathonStatus;
    publicado?: boolean;
  }): Promise<Hackathon[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.publicado !== undefined)
      params.append('publicado', String(filters.publicado));

    const response = await fetch(
      `${API_URL}/hackathons?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener hackathones');
    }

    return response.json();
  },

  // Obtener hackathones públicos
  async getPublic(): Promise<Hackathon[]> {
    const response = await fetch(`${API_URL}/hackathons/public`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener hackathones públicos');
    }

    return response.json();
  },

  // Obtener mis hackathones (requiere autenticación)
  async getMyHackathons(token: string): Promise<Hackathon[]> {
    const response = await fetch(`${API_URL}/hackathons/my-hackathons`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener mis hackathones');
    }

    return response.json();
  },

  // Obtener un hackathon por ID
  async getById(id: string): Promise<Hackathon> {
    const response = await fetch(`${API_URL}/hackathons/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el hackathon');
    }

    return response.json();
  },

  // Crear un hackathon (solo organizadores)
  async create(
    data: CreateHackathonDto,
    token: string
  ): Promise<Hackathon> {
    const response = await fetch(`${API_URL}/hackathons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el hackathon');
    }

    return response.json();
  },

  // Actualizar un hackathon (solo el organizador)
  async update(
    id: string,
    data: UpdateHackathonDto,
    token: string
  ): Promise<Hackathon> {
    const response = await fetch(`${API_URL}/hackathons/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el hackathon');
    }

    return response.json();
  },

  // Eliminar un hackathon (solo el organizador)
  async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/hackathons/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el hackathon');
    }
  },

  // Cambiar el estado de un hackathon
  async updateStatus(
    id: string,
    estado: HackathonStatus,
    token: string
  ): Promise<Hackathon> {
    const response = await fetch(`${API_URL}/hackathons/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cambiar el estado');
    }

    return response.json();
  },

  // Publicar un hackathon
  async publish(id: string, token: string): Promise<Hackathon> {
    const response = await fetch(`${API_URL}/hackathons/${id}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al publicar el hackathon');
    }

    return response.json();
  },

  // Despublicar un hackathon
  async unpublish(id: string, token: string): Promise<Hackathon> {
    const response = await fetch(`${API_URL}/hackathons/${id}/unpublish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al despublicar el hackathon');
    }

    return response.json();
  },

  // Verificar elegibilidad para inscribirse
  async checkEligibility(id: string, token: string): Promise<{
    isEligible: boolean;
    reasons: string[];
  }> {
    const response = await fetch(`${API_URL}/hackathons/${id}/eligibility`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al verificar elegibilidad');
    }

    return response.json();
  },

  // Inscribirse a un hackathon
  async register(id: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/hackathons/${id}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al inscribirse al hackathon');
    }

    return response.json();
  },

  // Cancelar inscripción
  async unregister(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/hackathons/${id}/register`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cancelar la inscripción');
    }
  },
};
