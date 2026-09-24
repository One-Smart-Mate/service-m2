import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('evidences')
@Index('idx_evidences_site_sync', ['siteId', 'syncChangedAt', 'cardId'])
@Index('idx_evidences_site_card_state', [
  'siteId',
  'cardId',
  'status',
  'deletedAt',
])
export class EvidenceEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'id' })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'card_id' })
  cardId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'site_id' })
  siteId: number;

  @Column({ type: 'varchar', length: 500, name: 'evidence_name' })
  evidenceName: string;

  @Column({ type: 'char', length: 5, name: 'evidence_type' })
  evidenceType: string;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({
    name: 'sync_changed_at',
    type: 'timestamp',
    precision: 6,
    select: false,
    insert: false,
    update: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  syncChangedAt: Date;
}
