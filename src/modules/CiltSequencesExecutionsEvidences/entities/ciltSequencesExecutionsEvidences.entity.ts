import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesExecutionsEntity } from '../../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { PositionEntity } from '../../position/entities/position.entity';
import { SiteEntity } from '../../site/entities/site.entity';

@Entity('cilt_sequences_executions_evidences')
export class CiltSequencesExecutionsEvidencesEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("int", { name: "position_id", nullable: true, unsigned: true })
  positionId: number | null;

  @Column("int", { name: "cilt_id", nullable: true, unsigned: true })
  ciltId: number | null;

  @Column("int", { name: "cilt_sequences_executions_id", nullable: true, unsigned: true })
  ciltSequencesExecutionsId: number | null;

  @Column("varchar", { name: "evidence_url", nullable: true, length: 500 })
  evidenceUrl: string | null;

  @Column("enum", {
    name: "type",
    enum: ['INITIAL', 'FINAL'],
    nullable: true,
    comment: 'Type of evidence, can be INITIAL or FINAL'
  })
  type: 'INITIAL' | 'FINAL' | null;

  @Column("timestamp", { 
    name: "created_at", 
    nullable: true,
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => CiltMstrEntity)
  @JoinColumn({ name: 'cilt_id' })
  cilt: CiltMstrEntity;

  @ManyToOne(() => CiltSequencesExecutionsEntity, (execution) => execution.evidences)
  @JoinColumn({ name: 'cilt_sequences_executions_id' })
  ciltSequencesExecutions: CiltSequencesExecutionsEntity;

  @ManyToOne(() => PositionEntity)
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;
}