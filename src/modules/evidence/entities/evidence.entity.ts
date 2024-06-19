import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('evidences')
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
}
