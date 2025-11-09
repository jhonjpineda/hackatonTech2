import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

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

export enum ChallengeCreationMode {
  DIGITAL = 'DIGITAL',
  PDF = 'PDF',
  HYBRID = 'HYBRID',
}

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text', default: ChallengeDifficulty.MEDIO })
  dificultad: ChallengeDifficulty;

  @Column({ type: 'text', default: ChallengeStatus.DRAFT })
  estado: ChallengeStatus;

  @Column({ type: 'int', nullable: true })
  puntos?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentaje: number;

  @Column({ type: 'text', nullable: true, name: 'criterios_evaluacion' })
  criteriosEvaluacion?: string;

  @Column({ type: 'text', nullable: true })
  recursos?: string;

  @Column({ type: 'text', nullable: true })
  entregables?: string;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_limite' })
  fechaLimite?: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'url_pdf' })
  urlPdf?: string;

  @Column({
    type: 'text',
    name: 'creation_mode',
    default: ChallengeCreationMode.DIGITAL,
  })
  creationMode: ChallengeCreationMode;

  @Column({ type: 'int', default: 0 })
  orden: number;

  // Relaciones
  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.challenges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
