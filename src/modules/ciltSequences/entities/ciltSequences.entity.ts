import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cilt_secuences')
export class CiltSequencesEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("varchar", { name: "site_name", nullable: true, length: 100 })
  siteName: string | null;

  @Column("int", { name: "area_id", nullable: true })
  areaId: number | null;

  @Column("varchar", { name: "area_name", nullable: true, length: 100 })
  areaName: string | null;

  @Column("int", {
    name: "position_id",
    nullable: true,
    comment: "inherited from positions",
  })
  positionId: number | null;

  @Column("varchar", { name: "position_name", length: 45 })
  positionName: string;

  @Column("int", { name: "cilt_mstr_id", nullable: true })
  ciltMstrId: number | null;

  @Column("varchar", { name: "cilt_mstr_name", nullable: true, length: 45 })
  ciltMstrName: string | null;

  @Column("int", {
    name: "level_id",
    nullable: true,
    comment: "final node where the sequence is created",
  })
  levelId: number | null;

  @Column("varchar", { name: "level_name", nullable: true, length: 45 })
  levelName: string | null;

  @Column("tinyint", {
    name: "order",
    nullable: true,
    comment: "order in which the sequences are displayed",
  })
  order: number | null;

  @Column("text", {
    name: "secuence_list",
    nullable: true,
    comment:
      "sequence of steps to follow, it is a text with format, it can be a list",
  })
  secuenceList: string | null;

  @Column("char", {
    name: "secuence_color",
    nullable: true,
    comment: "sequence color in hexadecimal",
    length: 6,
  })
  secuenceColor: string | null;

  @Column("int", {
    name: "cilt_type_id",
    nullable: true,
    comment:
      "type of CILT to execute, comes from the cilt_types table; a sequence can only have one type of cilt",
  })
  ciltTypeId: number | null;

  @Column("varchar", { name: "cilt_type_name", nullable: true, length: 45 })
  ciltTypeName: string | null;

  @Column("int", {
    name: "reference_opl_sop",
    nullable: true,
    comment: "comes from the opl_mstr table",
  })
  referenceOplSop: number | null;

  @Column("int", {
    name: "standard_time",
    nullable: true,
    comment:
      "execution time of the sequence; captured in seconds, displayed in natural language",
  })
  standardTime: number | null;

  @Column("varchar", {
    name: "standard_ok",
    nullable: true,
    comment: "simple text that indicates what the expected standard is or to be fulfilled",
    length: 100,
  })
  standardOk: string | null;

  @Column("int", {
    name: "remediation_opl_sop",
    nullable: true,
    comment: "comes from the opl_mstr table",
  })
  remediationOplSop: number | null;

  @Column("text", {
    name: "tools_required",
    nullable: true,
    comment:
      "simple text, tools necessary to carry out the tasks",
  })
  toolsRequired: string | null;

  @Column("tinyint", {
    name: "stoppage_reason",
    nullable: true,
    comment: "YES/NO if the standard is not met, is the reason for stoppage?",
  })
  stoppageReason: number | null;

  @Column("tinyint", {
    name: "quantity_pictures_create",
    nullable: true,
    comment:
      "quantity of images at the beginning of the sequence to support the status in which the equipment was found, default 1",
    default: () => "'1'",
  })
  quantityPicturesCreate: number | null;

  @Column("tinyint", {
    name: "quantity_pictures_close",
    nullable: true,
    comment:
      "quantity of images at the end of the sequence to support the status in which the equipment was left, default 1",
    default: () => "'1'",
  })
  quantityPicturesClose: number | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'CURRENT_TIMESTAMP(6)'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

}
