import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Hackathon } from './hackathon.entity';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'hackathon_id' })
  hackathonId: string;

  @Column({
    type: 'text',
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  @Column({ type: 'boolean', name: 'is_eligible', default: true })
  isEligible: boolean;

  @Column({ type: 'text', name: 'eligibility_reason', nullable: true })
  eligibilityReason?: string;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'registration_date' })
  registrationDate: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Hackathon, { eager: true })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon: Hackathon;
}
