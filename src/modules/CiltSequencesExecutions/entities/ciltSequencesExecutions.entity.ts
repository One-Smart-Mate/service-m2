import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('cilt_secuencies_executions')
export class CiltSequencesExecutionsEntity {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'cilt_id', type: 'int', nullable: true })
  ciltId: number | null;

  @Column({ name: 'sequence_id', type: 'int', nullable: true })
  sequenceId: number | null;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'user_name', type: 'varchar', length: 100, nullable: true })
  userName: string | null;

  @Column({ name: 'status', type: 'char', length: 1, nullable: true, default: () => "'A'" })
  status: string | null;

  @Column({ name: 'execution_date', type: 'timestamp', nullable: true })
  executionDate: Date | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Exclude()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
} 