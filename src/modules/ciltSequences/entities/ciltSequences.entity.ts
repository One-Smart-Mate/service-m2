import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cilt_secuences')
export class CiltSequences {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cilt_id' })
  ciltId: number;

  @Column({ name: 'sequence_number' })
  sequenceNumber: number;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'status', default: 'A' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 