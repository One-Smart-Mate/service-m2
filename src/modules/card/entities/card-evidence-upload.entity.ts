import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('card_evidence_uploads')
@Index(
  'uq_card_upload_identity',
  ['siteId', 'cardUUID', 'evidenceType', 'evidenceId'],
  { unique: true },
)
@Index('uq_card_upload_key', ['objectKey'], { unique: true })
export class CardEvidenceUploadEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'site_id', type: 'bigint', unsigned: true }) siteId: number;
  @Column({ name: 'card_uuid', length: 60 }) cardUUID: string;
  @Column({ name: 'evidence_id', length: 60 }) evidenceId: string;
  @Column({ name: 'evidence_type', length: 4 }) evidenceType: string;
  @Column({ name: 'object_key', length: 300 }) objectKey: string;
  @Column({ name: 'owner_id', type: 'bigint', unsigned: true }) ownerId: number;
  @Column({ name: 'content_hash', length: 64 }) contentHash: string;
  @Column({ name: 'content_type', length: 100 }) contentType: string;
  @Column({ type: 'int', unsigned: true }) size: number;
  @Column({ length: 10, default: 'PENDING' }) status: 'PENDING' | 'UPLOADED';
  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
