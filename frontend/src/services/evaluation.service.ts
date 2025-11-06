const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Evaluation {
  id: string;
  calificacion: number;
  comentarios?: string;
  fechaEvaluacion?: string;
  rubricId: string;
  teamId: string;
  juezId: string;
  submissionId?: string;
  rubric?: {
    id: string;
    nombre: string;
    descripcion?: string;
    escalaMinima: number;
    escalaMaxima: number;
    porcentaje: number;
  };
  juez?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  createdAt: string;
}

export interface CreateEvaluationDto {
  rubricId: string;
  teamId: string;
  calificacion: number;
  comentarios?: string;
  submissionId?: string;
}

export interface TeamScore {
  teamId: string;
  challengeId: string;
  totalScore: number;
  details: Array<{
    rubricId: string;
    rubricName: string;
    percentage: number;
    score: number;
    normalizedScore: number;
    weightedScore: number;
  }>;
}

class EvaluationService {
  async create(data: CreateEvaluationDto, token: string): Promise<Evaluation> {
    const response = await fetch(`${API_URL}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear evaluación');
    }

    return response.json();
  }

  async getAll(token: string): Promise<Evaluation[]> {
    const response = await fetch(`${API_URL}/evaluations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener evaluaciones');
    }

    return response.json();
  }

  async getByTeam(teamId: string, token: string): Promise<Evaluation[]> {
    const response = await fetch(`${API_URL}/evaluations/team/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener evaluaciones del equipo');
    }

    return response.json();
  }

  async getBySubmission(submissionId: string, token: string): Promise<Evaluation[]> {
    const response = await fetch(`${API_URL}/evaluations/submission/${submissionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener evaluaciones de la entrega');
    }

    return response.json();
  }

  async getTeamScore(teamId: string, challengeId: string, token: string): Promise<TeamScore> {
    const response = await fetch(
      `${API_URL}/evaluations/team/${teamId}/score/${challengeId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener puntuación del equipo');
    }

    return response.json();
  }

  async update(
    id: string,
    data: Partial<CreateEvaluationDto>,
    token: string
  ): Promise<Evaluation> {
    const response = await fetch(`${API_URL}/evaluations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar evaluación');
    }

    return response.json();
  }

  async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/evaluations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar evaluación');
    }
  }
}

export const evaluationService = new EvaluationService();
