import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { Challenge } from './challenge.entity';
import { Topic } from './topic.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icono?: string; // Nombre del icono o emoji

  @Column({ type: 'int', name: 'max_participantes', nullable: true })
  maxParticipantes?: number;

  @Column({ type: 'int', name: 'max_equipos', nullable: true })
  maxEquipos?: number;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  // Relaciones
  @Column({ name: 'hackathon_id' })
  hackathonId: string;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon: Hackathon;

  @Column({ name: 'topic_id', nullable: true })
  topicId?: string;

  @ManyToOne(() => Topic, { eager: true, nullable: true })
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic;

  @OneToMany(() => Challenge, (challenge) => challenge.category)
  challenges: Challenge[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
