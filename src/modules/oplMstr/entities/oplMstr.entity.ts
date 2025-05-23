import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("opl_mstr", { schema: "railway" })
export class OplMstr {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "title", length: 100 })
  title: string;

  @Column("varchar", { name: "objetive", nullable: true, length: 255 })
  objetive: string | null;

  @Column("int", { name: "creator_id", nullable: true })
  creatorId: number | null;

  @Column("varchar", { name: "creator_name", nullable: true, length: 100 })
  creatorName: string | null;

  @Column("bigint", { name: "site_id", nullable: true })
  siteId: bigint | null;

  @Column("int", { name: "reviewer_id", nullable: true })
  reviewerId: number | null;

  @Column("varchar", { name: "reviewer_name", nullable: true, length: 100 })
  reviewerName: string | null;

  @Column("enum", { name: "opl_type", nullable: true, enum: ["opl", "sop"] })
  oplType: "opl" | "sop" | null;

  @Column("datetime", {
    name: "created_at",
    nullable: true
  })
  createdAt: Date | null;

  @Column("datetime", {
    name: "updated_at",
    nullable: true
  })
  updatedAt: Date | null;

  @Column("datetime", {
    name: "deleted_at",
    nullable: true
  })
  deletedAt: Date | null;
} 