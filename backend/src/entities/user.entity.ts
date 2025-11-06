import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Campista } from './campista.entity';
import { Topic } from './topic.entity';

export enum UserRole {
  CAMPISTA = 'CAMPISTA',
  JUEZ = 'JUEZ',
  ORGANIZADOR = 'ORGANIZADOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum UserSource {
  SIGA = 'SIGA',
  DIRECT = 'DIRECT',
}

export enum SigaStatus {
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  NO_VERIFICADO = 'NO_VERIFICADO',
  INHABILITADO = 'INHABILITADO',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  documento: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({
    type: 'text',
    default: UserRole.CAMPISTA,
  })
  role: UserRole;

  @Column({
    type: 'text',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin?: Date;

  // Campos para integración con SIGA
  @Column({ name: 'tipo_documento', nullable: true })
  tipoDocumento?: string;

  @Column({ name: 'siga_preinscripcion_id', nullable: true })
  sigaPreinscripcionId?: string;

  @Column({ name: 'siga_inscripcion_id', nullable: true })
  sigaInscripcionId?: string;

  @Column({
    type: 'text',
    name: 'siga_status',
    nullable: true,
  })
  sigaStatus?: SigaStatus;

  @Column({
    type: 'text',
    name: 'source',
    default: UserSource.DIRECT,
  })
  source: UserSource;

  @Column({ name: 'is_pre_registered', default: false })
  isPreRegistered: boolean;

  @Column({ name: 'is_fully_registered', default: false })
  isFullyRegistered: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'token_expiration', type: 'datetime', nullable: true })
  tokenExpiration?: Date;

  // Campos adicionales de SIGA
  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: Date;

  @Column({ name: 'fecha_expedicion_documento', type: 'date', nullable: true })
  fechaExpedicionDocumento?: Date;

  @Column({ name: 'genero', nullable: true })
  genero?: string;

  @Column({ name: 'departamento_residencia', nullable: true })
  departamentoResidencia?: string;

  @Column({ name: 'municipio_residencia', nullable: true })
  municipioResidencia?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Campista, (campista) => campista.user)
  campista?: Campista;

  @ManyToMany(() => Topic)
  @JoinTable({
    name: 'users_interest_topics',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'topic_id', referencedColumnName: 'id' },
  })
  interestTopics: Topic[];
}
