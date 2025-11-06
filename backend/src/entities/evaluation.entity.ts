import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Rubric } from './rubric.entity';
import { Team } from './team.entity';
import { User } from './user.entity';
import { Submission } from './submission.entity';

@Entity('evaluations')
@Unique(['rubricId', 'teamId', 'juezId'])
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  calificacion: number;

  @Column({ type: 'text', nullable: true })
  comentarios?: string;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_evaluacion' })
  fechaEvaluacion?: Date;

  // Relaciones
  @Column({ name: 'rubric_id' })
  rubricId: string;

  @ManyToOne(() => Rubric, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rubric_id' })
  rubric: Rubric;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'juez_id' })
  juezId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'juez_id' })
  juez: User;

  @Column({ name: 'submission_id', nullable: true })
  submissionId?: string;

  @ManyToOne(() => Submission, (submission) => submission.evaluations, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission?: Submission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
