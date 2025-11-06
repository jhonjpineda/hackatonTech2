export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  maxParticipantes?: number;
  maxEquipos?: number;
  activa: boolean;
  hackathonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  nombre: string;
  descripcion?: string;
  icono?: string;
  maxParticipantes?: number;
  maxEquipos?: number;
  activa?: boolean;
  hackathonId: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
