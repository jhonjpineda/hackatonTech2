import { Team, CreateTeamDto, UpdateTeamDto, AddMemberDto } from '@/types/team';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const teamService = {
  // Obtener todos los equipos
  async getAll(token: string): Promise<Team[]> {
    const response = await fetch(`${API_URL}/teams`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los equipos');
    }

    return response.json();
  },

  // Obtener equipos por categoría (hackathon)
  async getByCategory(categoryId: string, token: string): Promise<Team[]> {
    const response = await fetch(`${API_URL}/teams/category/${categoryId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los equipos de la categoría');
    }

    return response.json();
  },

  // Obtener un equipo por ID
  async getById(id: string, token: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el equipo');
    }

    return response.json();
  },

  // Crear un equipo
  async create(data: CreateTeamDto, token: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el equipo');
    }

    return response.json();
  },

  // Actualizar un equipo
  async update(id: string, data: UpdateTeamDto, token: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el equipo');
    }

    return response.json();
  },

  // Eliminar un equipo
  async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el equipo');
    }
  },

  // Agregar miembro a un equipo
  async addMember(teamId: string, data: AddMemberDto, token: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al agregar miembro al equipo');
    }

    return response.json();
  },

  // Eliminar miembro de un equipo
  async removeMember(teamId: string, memberId: string, token: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar miembro del equipo');
    }

    return response.json();
  },
};
