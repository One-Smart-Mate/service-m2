import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { CiltSequencesEntity } from '../../ciltSequences/entities/ciltSequences.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

@Entity('cilt_mstr')
export class CiltMstrEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('int', { name: 'site_id', nullable: true, unsigned: true })
  siteId: number | null;

  @Column('varchar', { name: 'cilt_name', length: 45, nullable: true })
  ciltName: string | null;

  @Column('varchar', { name: 'cilt_description', length: 500, nullable: true })
  ciltDescription: string | null;

  @Column('int', { name: 'creator_id', nullable: true, unsigned: true })
  creatorId: number | null;

  @Column('varchar', { name: 'creator_name', length: 100, nullable: true })
  creatorName: string | null;

  @Column('int', { name: 'reviewer_id', nullable: true, unsigned: true })
  reviewerId: number | null;

  @Column('varchar', { name: 'reviewer_name', length: 100, nullable: true })
  reviewerName: string | null;

  @Column('int', { name: 'approved_by_id', nullable: true, unsigned: true })
  approvedById: number | null;

  @Column('varchar', { name: 'approved_by_name', length: 100, nullable: true })
  approvedByName: string | null;

  @Column('datetime', { name: 'cilt_due_date', nullable: true })
  ciltDueDate: Date | null;

  @Column('int', { name: 'standard_time', nullable: true })
  standardTime: number | null;

  @Column('varchar', { name: 'url_img_layout', length: 500, nullable: true })
  urlImgLayout: string | null;

  @Column('tinyint', { name: 'order', default: 1, nullable: true })
  order: number;

  @Column('char', { name: 'status', length: 1, default: 'A', nullable: true })
  status: string | null;

  @Column('timestamp', { name: 'date_of_last_used', nullable: true })
  dateOfLastUsed: Date | null;

  @Column('timestamp', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('timestamp', {
    name: 'updated_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => CiltSequencesEntity, (sequence) => sequence.ciltMstr)
  sequences: CiltSequencesEntity[];

  @ManyToOne(() => SiteEntity, (site) => site.cilts)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;
}
