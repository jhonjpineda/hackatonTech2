import { User } from './auth';
import { Rubric } from './rubric';
import { Team } from './team';

export interface Evaluation {
  id: string;
  calificacion: number;
  comentarios?: string;
  fechaEvaluacion?: string;
  rubricId: string;
  rubric?: Rubric;
  teamId: string;
  team?: Team;
  juezId: string;
  juez?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationDto {
  calificacion: number;
  comentarios?: string;
  rubricId: string;
  teamId: string;
}

export type UpdateEvaluationDto = Partial<CreateEvaluationDto>;
