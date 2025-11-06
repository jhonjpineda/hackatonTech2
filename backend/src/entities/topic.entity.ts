import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TopicType {
  PROGRAMACION = 'PROGRAMACION',
  INTELIGENCIA_ARTIFICIAL = 'INTELIGENCIA_ARTIFICIAL',
  ANALISIS_DATOS = 'ANALISIS_DATOS',
  ARQUITECTURA_NUBE = 'ARQUITECTURA_NUBE',
  BLOCKCHAIN = 'BLOCKCHAIN',
  CIBERSEGURIDAD = 'CIBERSEGURIDAD',
}

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  nombre: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  descripcion?: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    name: 'codigo',
  })
  codigo: TopicType;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  icono?: string;

  @Column({
    type: 'varchar',
    length: 7,
    nullable: true,
    name: 'color_hex',
  })
  colorHex?: string;

  @Column({
    type: 'int',
    default: 0,
  })
  orden: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
