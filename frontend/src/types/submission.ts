import { Team } from './team';
import { Challenge } from './challenge';

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EVALUATED = 'EVALUATED',
  REJECTED = 'REJECTED',
}

export interface Submission {
  id: string;
  titulo: string;
  descripcion: string;
  repositorioUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  tecnologias?: string; // JSON string
  tecnologiasArray?: string[]; // Parsed array
  documentacionUrl?: string;
  status: SubmissionStatus;
  submittedAt?: Date | string;
  puntajeFinal?: number;
  comentarios?: string;
  teamId: string;
  team?: Team;
  challengeId: string;
  challenge?: Challenge;
  evaluations?: any[]; // TODO: tipo Evaluation cuando esté definido
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateSubmissionDto {
  titulo: string;
  descripcion: string;
  repositorioUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  tecnologias?: string[];
  documentacionUrl?: string;
  teamId: string;
  challengeId: string;
  comentarios?: string;
}

export interface UpdateSubmissionDto {
  titulo?: string;
  descripcion?: string;
  repositorioUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  tecnologias?: string[];
  documentacionUrl?: string;
  comentarios?: string;
}

export interface LeaderboardEntry {
  submission: Submission;
  team: Team;
  puntajeFinal: number;
  position: number;
}

// Helper para obtener el label del estado en español
export const getStatusLabel = (status: SubmissionStatus): string => {
  const labels: Record<SubmissionStatus, string> = {
    [SubmissionStatus.DRAFT]: 'Borrador',
    [SubmissionStatus.SUBMITTED]: 'Enviada',
    [SubmissionStatus.UNDER_REVIEW]: 'En Revisión',
    [SubmissionStatus.EVALUATED]: 'Evaluada',
    [SubmissionStatus.REJECTED]: 'Rechazada',
  };
  return labels[status] || status;
};

// Helper para obtener el color del estado
export const getStatusColor = (status: SubmissionStatus): string => {
  const colors: Record<SubmissionStatus, string> = {
    [SubmissionStatus.DRAFT]: 'gray',
    [SubmissionStatus.SUBMITTED]: 'blue',
    [SubmissionStatus.UNDER_REVIEW]: 'yellow',
    [SubmissionStatus.EVALUATED]: 'green',
    [SubmissionStatus.REJECTED]: 'red',
  };
  return colors[status] || 'gray';
};
