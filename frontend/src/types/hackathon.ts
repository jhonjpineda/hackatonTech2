export enum HackathonStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum HackathonMode {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  HIBRIDO = 'HIBRIDO',
}

export interface Topic {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  icono?: string;
  colorHex?: string;
  orden: number;
  activo: boolean;
}

export interface Hackathon {
  id: string;
  nombre: string;
  descripcion: string;
  descripcionCorta?: string;
  estado: HackathonStatus;
  modalidad: HackathonMode;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  ubicacion?: string;
  urlImagen?: string;
  maxParticipantes?: number;
  maxEquipos?: number;
  minMiembrosEquipo: number;
  maxMiembrosEquipo: number;
  requisitos?: string;
  premios?: string;
  reglas?: string;
  recursos?: string;
  urlDiscord?: string;
  urlSlack?: string;
  urlWhatsapp?: string;
  inscripcionAbierta: boolean;
  publicado: boolean;
  organizadorId: string;
  organizador: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  topics?: Topic[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHackathonDto {
  nombre: string;
  descripcion: string;
  descripcionCorta?: string;
  estado?: HackathonStatus;
  modalidad: HackathonMode;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  ubicacion?: string;
  urlImagen?: string;
  maxParticipantes?: number;
  maxEquipos?: number;
  minMiembrosEquipo: number;
  maxMiembrosEquipo: number;
  requisitos?: string;
  premios?: string;
  reglas?: string;
  recursos?: string;
  urlDiscord?: string;
  urlSlack?: string;
  urlWhatsapp?: string;
  inscripcionAbierta?: boolean;
  publicado?: boolean;
  topicsIds?: string[];
}

export type UpdateHackathonDto = Partial<CreateHackathonDto>;
