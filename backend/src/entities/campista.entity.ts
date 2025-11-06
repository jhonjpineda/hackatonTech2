import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('campistas')
export class Campista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ nullable: true })
  institucion?: string;

  @Column({ nullable: true })
  programa?: string;

  @Column({ type: 'text', nullable: true })
  biografia?: string;

  @Column({ name: 'github_url', nullable: true })
  githubUrl?: string;

  @Column({ name: 'linkedin_url', nullable: true })
  linkedinUrl?: string;

  @Column({ name: 'portfolio_url', nullable: true })
  portfolioUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.campista)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
