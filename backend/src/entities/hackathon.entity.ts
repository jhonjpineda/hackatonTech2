import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { CommunicationChannel } from './communication-channel.entity';
import { Topic } from './topic.entity';

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

@Entity('hackathons')
export class Hackathon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  descripcionCorta?: string;

  @Column({ type: 'text', default: HackathonStatus.DRAFT })
  estado: HackathonStatus;

  @Column({ type: 'text', default: HackathonMode.PRESENCIAL })
  modalidad: HackathonMode;

  @Column({ type: 'datetime', name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'datetime', name: 'fecha_fin' })
  fechaFin: Date;

  @Column({ type: 'datetime', name: 'fecha_limite_inscripcion' })
  fechaLimiteInscripcion: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ubicacion?: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'url_imagen' })
  urlImagen?: string;

  @Column({ type: 'int', name: 'max_participantes', nullable: true })
  maxParticipantes?: number;

  @Column({ type: 'int', name: 'max_equipos', nullable: true })
  maxEquipos?: number;

  @Column({ type: 'int', name: 'min_miembros_equipo', default: 1 })
  minMiembrosEquipo: number;

  @Column({ type: 'int', name: 'max_miembros_equipo', default: 5 })
  maxMiembrosEquipo: number;

  @Column({ type: 'text', nullable: true })
  requisitos?: string;

  @Column({ type: 'text', nullable: true })
  premios?: string;

  @Column({ type: 'text', nullable: true })
  reglas?: string;

  @Column({ type: 'text', nullable: true })
  recursos?: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'url_discord' })
  urlDiscord?: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'url_slack' })
  urlSlack?: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'url_whatsapp' })
  urlWhatsapp?: string;

  @Column({ type: 'boolean', name: 'inscripcion_abierta', default: true })
  inscripcionAbierta: boolean;

  @Column({ type: 'boolean', name: 'publicado', default: false })
  publicado: boolean;

  // Relaciones
  @Column({ name: 'organizador_id' })
  organizadorId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'organizador_id' })
  organizador: User;

  @OneToMany(() => Category, (category) => category.hackathon)
  categories: Category[];

  @OneToMany(
    () => CommunicationChannel,
    (channel) => channel.hackathon,
  )
  communicationChannels: CommunicationChannel[];

  @ManyToMany(() => Topic)
  @JoinTable({
    name: 'hackathon_topics',
    joinColumn: { name: 'hackathon_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'topic_id', referencedColumnName: 'id' },
  })
  topics: Topic[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
