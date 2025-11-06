import {
  Submission,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  LeaderboardEntry,
} from '@/types/submission';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const submissionService = {
  // Obtener todas las entregas (solo organizadores/jueces)
  async getAll(token: string): Promise<Submission[]> {
    const response = await fetch(`${API_URL}/submissions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las entregas');
    }

    return response.json();
  },

  // Obtener entregas por reto
  async getByChallenge(challengeId: string, token: string): Promise<Submission[]> {
    const response = await fetch(`${API_URL}/submissions/challenge/${challengeId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las entregas del reto');
    }

    return response.json();
  },

  // Obtener entregas por equipo
  async getByTeam(teamId: string, token: string): Promise<Submission[]> {
    const response = await fetch(`${API_URL}/submissions/team/${teamId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las entregas del equipo');
    }

    return response.json();
  },

  // Obtener mis entregas (equipos donde participo)
  async getMySubmissions(token: string): Promise<Submission[]> {
    const response = await fetch(`${API_URL}/submissions/my-submissions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener tus entregas');
    }

    return response.json();
  },

  // Obtener una entrega por ID
  async getById(id: string, token: string): Promise<Submission> {
    const response = await fetch(`${API_URL}/submissions/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener la entrega');
    }

    return response.json();
  },

  // Crear una entrega (borrador)
  async create(data: CreateSubmissionDto, token: string): Promise<Submission> {
    const response = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear la entrega');
    }

    return response.json();
  },

  // Actualizar una entrega
  async update(id: string, data: UpdateSubmissionDto, token: string): Promise<Submission> {
    const response = await fetch(`${API_URL}/submissions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar la entrega');
    }

    return response.json();
  },

  // Eliminar una entrega
  async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/submissions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar la entrega');
    }
  },

  // Enviar una entrega (cambiar de DRAFT a SUBMITTED)
  async submit(id: string, token: string): Promise<Submission> {
    const response = await fetch(`${API_URL}/submissions/${id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al enviar la entrega');
    }

    return response.json();
  },

  // Iniciar revisión de una entrega (solo jueces/organizadores)
  async startReview(id: string, token: string): Promise<Submission> {
    const response = await fetch(`${API_URL}/submissions/${id}/start-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar revisión');
    }

    return response.json();
  },

  // Marcar entrega como evaluada (solo jueces/organizadores)
  async markAsEvaluated(id: string, token: string): Promise<Submission> {
    const response = await fetch(`${API_URL}/submissions/${id}/mark-evaluated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al marcar como evaluada');
    }

    return response.json();
  },

  // Obtener tabla de posiciones de un reto
  async getLeaderboard(challengeId: string, token: string): Promise<LeaderboardEntry[]> {
    const response = await fetch(`${API_URL}/submissions/challenge/${challengeId}/leaderboard`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener la tabla de posiciones');
    }

    return response.json();
  },
};
