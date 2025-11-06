import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Hackathon } from './hackathon.entity';
import { Team } from './team.entity';

@Entity('judge_assignments')
export class JudgeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'juez_id' })
  juezId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'juez_id' })
  juez: User;

  @Column({ name: 'hackathon_id' })
  hackathonId: string;

  @ManyToOne(() => Hackathon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon: Hackathon;

  // Si tiene equipos asignados específicos, sino puede ver todos
  @ManyToMany(() => Team)
  @JoinTable({
    name: 'judge_assigned_teams',
    joinColumn: { name: 'judge_assignment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'team_id', referencedColumnName: 'id' },
  })
  assignedTeams: Team[];

  @Column({ type: 'boolean', name: 'can_see_all_teams', default: true })
  canSeeAllTeams: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
