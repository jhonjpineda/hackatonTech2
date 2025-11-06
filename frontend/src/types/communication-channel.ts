export enum ChannelType {
  WHATSAPP = 'WHATSAPP',
  DISCORD = 'DISCORD',
  SLACK = 'SLACK',
  ZOOM = 'ZOOM',
  GOOGLE_MEET = 'GOOGLE_MEET',
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
  TELEGRAM = 'TELEGRAM',
  OTRO = 'OTRO',
}

export interface CommunicationChannel {
  id: string;
  tipo: ChannelType;
  url: string;
  nombrePersonalizado?: string;
  descripcion?: string;
  orden: number;
  hackathonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunicationChannelDto {
  tipo: ChannelType;
  url: string;
  nombrePersonalizado?: string;
  descripcion?: string;
  orden?: number;
  hackathonId: string;
}

export type UpdateCommunicationChannelDto = Partial<CreateCommunicationChannelDto>;
