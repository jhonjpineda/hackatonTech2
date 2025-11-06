const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface JudgeAssignment {
  id: string;
  juezId: string;
  hackathonId: string;
  canSeeAllTeams: boolean;
  activo: boolean;
  juez?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    documento: string;
  };
  hackathon?: {
    id: string;
    nombre: string;
    descripcion: string;
  };
  assignedTeams?: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AssignJudgeDto {
  juezId: string;
  hackathonId: string;
  teamIds?: string[];
}

export interface UpdateAssignmentDto {
  teamIds?: string[];
}

class JudgeAssignmentService {
  async assignJudge(data: AssignJudgeDto, token: string): Promise<JudgeAssignment> {
    const response = await fetch(`${API_URL}/judge-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al asignar juez');
    }

    return response.json();
  }

  async getJudgeAssignments(juezId: string, token: string): Promise<JudgeAssignment[]> {
    const response = await fetch(`${API_URL}/judge-assignments/judge/${juezId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener asignaciones');
    }

    return response.json();
  }

  async getMyAssignments(token: string): Promise<JudgeAssignment[]> {
    const response = await fetch(`${API_URL}/judge-assignments/my-assignments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener mis asignaciones');
    }

    return response.json();
  }

  async getHackathonJudges(hackathonId: string, token: string): Promise<JudgeAssignment[]> {
    const response = await fetch(`${API_URL}/judge-assignments/hackathon/${hackathonId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener jueces del hackathon');
    }

    return response.json();
  }

  async updateAssignment(
    assignmentId: string,
    data: UpdateAssignmentDto,
    token: string
  ): Promise<JudgeAssignment> {
    const response = await fetch(`${API_URL}/judge-assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar asignación');
    }

    return response.json();
  }

  async removeAssignment(assignmentId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/judge-assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al remover asignación');
    }
  }

  async getAccessibleTeams(hackathonId: string, token: string): Promise<any[]> {
    const response = await fetch(
      `${API_URL}/judge-assignments/accessible-teams/${hackathonId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener equipos accesibles');
    }

    return response.json();
  }
}

export const judgeAssignmentService = new JudgeAssignmentService();
