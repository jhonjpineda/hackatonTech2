export interface Rubric {
  id: string;
  nombre: string;
  descripcion?: string;
  porcentaje: number;
  escalaMaxima: number;
  escalaMinima: number;
  orden: number;
  activa: boolean;
  challengeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRubricDto {
  nombre: string;
  descripcion?: string;
  porcentaje: number;
  escalaMaxima?: number;
  escalaMinima?: number;
  orden?: number;
  activa?: boolean;
  challengeId: string;
}

export type UpdateRubricDto = Partial<CreateRubricDto>;
