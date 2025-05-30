import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { CiltSequencesEntity } from '../../ciltSequences/entities/ciltSequences.entity';

@Entity('cilt_mstr')
export class CiltMstrEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("int", { name: "position_id", nullable: true, unsigned: true })
  positionId: number | null;

  @Column("varchar", { name: "cilt_name", nullable: true, length: 45 })
  ciltName: string | null;

  @Column("varchar", { name: "cilt_description", nullable: true, length: 255 })
  ciltDescription: string | null;

  @Column("int", { name: "creator_id", nullable: true, unsigned: true })
  creatorId: number | null;

  @Column("varchar", { name: "creator_name", nullable: true, length: 100 })
  creatorName: string | null;

  @Column("int", { name: "reviewer_id", nullable: true, unsigned: true })
  reviewerId: number | null;

  @Column("varchar", { name: "reviewer_name", nullable: true, length: 100 })
  reviewerName: string | null;

  @Column("int", { name: "approved_by_id", nullable: true, unsigned: true })
  approvedById: number | null;

  @Column("varchar", { name: "approved_by_name", nullable: true, length: 100 })
  approvedByName: string | null;

  @Column("datetime", { name: "cilt_due_date", nullable: true })
  ciltDueDate: Date | null;

  @Column("int", { name: "standard_time", nullable: true })
  standardTime: number | null;

  @Column("varchar", { name: "learnig_time", nullable: true, length: 25 })
  learnigTime: string | null;

  @Column("varchar", { name: "url_img_layout", nullable: true, length: 500 })
  urlImgLayout: string | null;

  @Column("int", { name: "order", default: 1 })
  order: number;

  @Column("char", { name: "status", nullable: true, length: 1, default: 'A' })
  status: string | null;

  @Column("timestamp", { name: "date_of_last_used", nullable: true })
  dateOfLastUsed: Date | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt: Date | null;

  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP"
  })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => CiltSequencesEntity, (sequence) => sequence.ciltMstr)
  sequences: CiltSequencesEntity[];
}