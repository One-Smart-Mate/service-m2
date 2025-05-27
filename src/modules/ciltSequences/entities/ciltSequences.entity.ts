import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { SiteEntity } from '../../site/entities/site.entity';
import { LevelEntity } from '../../level/entities/level.entity';
import { PositionEntity } from '../../position/entities/position.entity';
import { CiltFrequenciesEntity } from '../../ciltFrequencies/entities/ciltFrequencies.entity';

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

  @Column("int", { name: "position_id", nullable: true })
  positionId: number | null;

  @Column("varchar", { name: "position_name", nullable: true, length: 45 })
  positionName: string | null;

  @Column("int", { name: "cilt_mstr_id", nullable: true })
  ciltMstrId: number | null;

  @Column("varchar", { name: "cilt_mstr_name", nullable: true, length: 45 })
  ciltMstrName: string | null;

  @Column("int", { name: "frecuency_id", nullable: true })
  frecuencyId: number | null;

  @Column("char", { name: "frecuency_code", nullable: true, length: 3 })
  frecuencyCode: string | null;

  @Column("int", { name: "level_id", nullable: true })
  levelId: number | null;

  @Column("varchar", { name: "level_name", nullable: true, length: 45 })
  levelName: string | null;

  @Column("varchar", { name: "route", nullable: true, length: 250 })
  route: string | null;

  @Column("char", { name: "reference_point", nullable: true, length: 10 })
  referencePoint: string | null;

  @Column("tinyint", { name: "order", nullable: true })
  order: number | null;

  @Column("text", { name: "secuence_list", nullable: true })
  secuenceList: string | null;

  @Column("char", { name: "secuence_color", nullable: true, length: 6 })
  secuenceColor: string | null;

  @Column("int", { name: "cilt_type_id", nullable: true })
  ciltTypeId: number | null;

  @Column("varchar", { name: "cilt_type_name", nullable: true, length: 45 })
  ciltTypeName: string | null;

  @Column("int", { name: "reference_opl_sop_id", nullable: true })
  referenceOplSopId: number | null;

  @Column("int", { name: "standard_time", nullable: true })
  standardTime: number | null;

  @Column("varchar", { name: "standard_ok", nullable: true, length: 100 })
  standardOk: string | null;

  @Column("int", { name: "remediation_opl_sop_id", nullable: true })
  remediationOplSopId: number | null;

  @Column("text", { name: "tools_required", nullable: true })
  toolsRequired: string | null;

  @Column("tinyint", { name: "stoppage_reason", nullable: true })
  stoppageReason: number | null;

  @Column("tinyint", { name: "machine_stopped", nullable: true, default: 0 })
  machineStopped: number | null;

  @Column("tinyint", { name: "quantity_pictures_create", nullable: true, default: 1 })
  quantityPicturesCreate: number | null;

  @Column("tinyint", { name: "quantity_pictures_close", nullable: true, default: 1 })
  quantityPicturesClose: number | null;

  @Column("tinyint", { name: "selectable_without_programming", nullable: true })
  selectableWithoutProgramming: number | null;

  @Column("char", { name: "status", nullable: true, length: 1, default: 'A' })
  status: string | null;

  @Column("timestamp", { name: "created_at", nullable: true, precision: 6, default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true, precision: 6 })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true, precision: 6 })
  deletedAt: Date | null;

  @ManyToOne(() => CiltMstrEntity, (ciltMstr) => ciltMstr.sequences)
  @JoinColumn({ name: 'cilt_mstr_id' })
  ciltMstr: CiltMstrEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'area_id' })
  area: LevelEntity;

  @ManyToOne(() => PositionEntity)
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;

  @ManyToOne(() => CiltFrequenciesEntity)
  @JoinColumn({ name: 'frecuency_id' })
  frequency: CiltFrequenciesEntity;
}
