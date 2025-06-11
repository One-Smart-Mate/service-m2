import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SiteEntity } from '../../site/entities/site.entity';

@Entity('priorities')
export class PriorityEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', unsigned: true })
  siteId: number;

  @Column({ name: 'priority_code', type: 'char', length: 4 })
  priorityCode: string;

  @Column({ name: 'site_code', type: 'char', length: 6 })
  siteCode: string;

  @Column({ name: 'priority_description', type: 'varchar', length: 50 })
  priorityDescription: string;

  @Column({ name: 'priority_days', type: 'tinyint', unsigned: true })
  priorityDays: number;

  @Column({ name: 'order', type: 'tinyint', nullable: true })
  order: number | null;

  @Column({ type: 'char', length: 1, default: 'A' })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;
}

