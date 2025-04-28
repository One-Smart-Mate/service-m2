import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cilt_secuences_frecuencies')
export class CiltSequencesFrequencies {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cilt_secuence_id' })
  ciltSecuenceId: number;

  @Column({ name: 'frecuency_id' })
  frecuencyId: number;

  @Column({ name: 'status', default: 'A' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 