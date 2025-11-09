export enum ChallengeDifficulty {
  FACIL = 'FACIL',
  MEDIO = 'MEDIO',
  DIFICIL = 'DIFICIL',
  EXPERTO = 'EXPERTO',
}

export enum ChallengeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export interface Challenge {
  id: string;
  titulo: string;
  descripcion: string;
  dificultad: ChallengeDifficulty;
  estado: ChallengeStatus;
  puntos?: number;
  porcentaje: number;
  criteriosEvaluacion?: string;
  recursos?: string;
  entregables?: string;
  fechaLimite?: string;
  urlPdf?: string;
  orden: number;
  categoryId: string;
  category?: {
    id: string;
    nombre: string;
    descripcion?: string;
    topic?: {
      id: string;
      nombre: string;
      codigo: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateChallengeDto {
  titulo: string;
  descripcion: string;
  dificultad?: ChallengeDifficulty;
  estado?: ChallengeStatus;
  puntos?: number;
  porcentaje: number;
  criteriosEvaluacion?: string;
  recursos?: string;
  entregables?: string;
  fechaLimite?: string;
  urlPdf?: string;
  orden?: number;
  categoryId: string;
}

export type UpdateChallengeDto = Partial<CreateChallengeDto>;
