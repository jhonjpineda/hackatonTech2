import { User } from './auth';

export interface Team {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  activo: boolean;
  categoryId: string;
  liderId: string;
  lider?: User;
  miembros?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDto {
  nombre: string;
  descripcion?: string;
  categoryId: string;
  miembrosIds?: string[];
}

export interface AddMemberDto {
  userId: string;
}

export type UpdateTeamDto = Partial<CreateTeamDto>;
