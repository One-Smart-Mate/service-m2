import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('cilt')
export class CiltMstrEntity {
  @PrimaryGeneratedColumn({ name: 'ID', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'int', nullable: true })
  siteId: number | null;

  @Column({ name: 'position_id', type: 'int', nullable: true })
  positionId: number | null;

  @Column({ name: 'name', type: 'varchar', length: 45, nullable: true })
  name: string | null;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'tools_required', type: 'text', nullable: true })
  toolsRequired: string | null;

  @Column({ name: 'standard_ok', type: 'boolean', default: false })
  standardOk: boolean;

  @Column({ name: 'repository_url', type: 'varchar', length: 255, nullable: true })
  repositoryUrl: string | null;

  @Column({ name: 'creator_id', type: 'int', nullable: true })
  creatorId: number | null;

  @Column({ name: 'creator_name', type: 'varchar', length: 100, nullable: true })
  creatorName: string | null;

  @Column({ name: 'reviewer_id', type: 'int', nullable: true })
  reviewerId: number | null;

  @Column({ name: 'reviewer_name', type: 'varchar', length: 100, nullable: true })
  reviewerName: string | null;

  @Column({ name: 'approved_by_id', type: 'int', nullable: true })
  approvedById: number | null;

  @Column({ name: 'approved_by_name', type: 'varchar', length: 100, nullable: true })
  approvedByName: string | null;

  @Column({ name: 'standard_time', type: 'int', nullable: true })
  standardTime: number | null;

  @Column({ name: 'learnig_time', type: 'varchar', length: 25, nullable: true })
  learningTime: string | null;

  @Column({ name: 'url_img_layout', type: 'varchar', length: 500, nullable: true })
  urlImgLayout: string | null;

  @Column({ name: 'order', type: 'int', nullable: true, default: () => "'1'" })
  order: number | null;

  @Column({ name: 'status', type: 'char', length: 1, nullable: true, default: () => "'A'" })
  status: string | null;

  @Column({ name: 'date_of_last_used', type: 'timestamp', nullable: true })
  dateOfLastUsed: Date | null;

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
