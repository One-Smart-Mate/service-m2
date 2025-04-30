import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cilt_mstr')
export class CiltMstrEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("int", { name: "position_id", nullable: true })
  positionId: number | null;

  @Column("varchar", { name: "cilt_name", nullable: true, length: 45 })
  ciltName: string | null;

  @Column("varchar", { name: "cilt_description", nullable: true, length: 255 })
  ciltDescription: string | null;

  @Column("int", { name: "creator_id", nullable: true })
  creatorId: number | null;

  @Column("varchar", { name: "creator_name", nullable: true, length: 100 })
  creatorName: string | null;

  @Column("int", { name: "reviewer_id", nullable: true })
  reviewerId: number | null;

  @Column("varchar", { name: "reviewer_name", nullable: true, length: 100 })
  reviewerName: string | null;

  @Column("int", { name: "approved_by_id", nullable: true })
  approvedById: number | null;

  @Column("varchar", { name: "approved_by_name", nullable: true, length: 100 })
  approvedByName: string | null;

  @Column("int", {
    name: "standard_time",
    nullable: true,
    comment:
      "standard execution time of the procedure, stored in seconds but displayed in natural language",
  })
  standardTime: number | null;

  @Column("varchar", {
    name: "learnig_time",
    nullable: true,
    comment:
      "learning time of the procedure, stored in natural language",
    length: 25,
  })
  learnigTime: string | null;

  @Column("varchar", {
    name: "url_img_layout",
    nullable: true,
    comment: "url where the machine diagram is stored",
    length: 500,
  })
  urlImgLayout: string | null;

  @Column("int", {
    name: "order",
    nullable: true,
    comment: "order of the cilt list",
    default: () => "'1'",
  })
  order: number | null;

  @Column("char", {
    name: "status",
    nullable: true,
    length: 1,
    default: () => "'A'",
  })
  status: string | null;

  @Column("timestamp", { name: "date_of_last_used", nullable: true })
  dateOfLastUsed: Date | null;

  @Column("timestamp", { name: "created_at", nullable: true })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}

