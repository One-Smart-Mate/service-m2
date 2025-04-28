import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('cilt_secuencies_evidences')
export class CiltSequencesEvidencesEntity {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'cilt_id', type: 'int', nullable: true })
  ciltId: number | null;

  @Column({ name: 'sequence_id', type: 'int', nullable: true })
  sequenceId: number | null;

  @Column({ name: 'evidence_url', type: 'varchar', length: 255, nullable: true })
  evidenceUrl: string | null;

  @Column({ name: 'evidence_type', type: 'varchar', length: 20, nullable: true })
  evidenceType: string | null;

  @Column({ name: 'status', type: 'char', length: 1, nullable: true, default: () => "'A'" })
  status: string | null;

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