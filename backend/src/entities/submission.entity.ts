import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { Challenge } from './challenge.entity';
import { Evaluation } from './evaluation.entity';

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EVALUATED = 'EVALUATED',
  REJECTED = 'REJECTED',
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  repositorioUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  demoUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  tecnologias: string; // JSON string array

  @Column({ type: 'text', nullable: true })
  documentacionUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: SubmissionStatus.DRAFT,
  })
  status: SubmissionStatus;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  puntajeFinal: number;

  @Column({ type: 'text', nullable: true })
  comentarios: string;

  // Relaciones
  @Column({ type: 'varchar' })
  teamId: string;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ type: 'varchar' })
  challengeId: string;

  @ManyToOne(() => Challenge, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.submission)
  evaluations: Evaluation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
