import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';

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

@Entity('communication_channels')
export class CommunicationChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  tipo: ChannelType;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombrePersonalizado?: string; // Para tipo OTRO

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  // Relaciones
  @Column({ name: 'hackathon_id' })
  hackathonId: string;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.communicationChannels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon: Hackathon;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
