import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { SiteEntity } from '../../site/entities/site.entity';
import { CiltFrequenciesEntity } from '../../ciltFrequencies/entities/ciltFrequencies.entity';
import { CiltSequencesExecutionsEntity } from '../../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';

@Entity('cilt_sequences')
export class CiltSequencesEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("varchar", { name: "site_name", nullable: true, length: 100 })
  siteName: string | null;

  @Column("int", { name: "cilt_mstr_id", nullable: true, unsigned: true })
  ciltMstrId: number | null;

  @Column("varchar", { name: "cilt_mstr_name", nullable: true, length: 45 })
  ciltMstrName: string | null;

  @Column("int", { name: "frecuency_id", nullable: true, unsigned: true })
  frecuencyId: number | null;

  @Column("char", { name: "frecuency_code", nullable: true, length: 3 })
  frecuencyCode: string | null;

  @Column("char", { name: "reference_point", nullable: true, length: 10 })
  referencePoint: string | null;

  @Column("tinyint", { name: "order", default: 1, nullable: false })
  order: number;

  @Column("text", { name: "secuence_list", nullable: true })
  secuenceList: string | null;

  @Column("char", { name: "secuence_color", nullable: true, length: 6 })
  secuenceColor: string | null;

  @Column("int", { name: "cilt_type_id", nullable: true })
  ciltTypeId: number | null;

  @Column("varchar", { name: "cilt_type_name", nullable: true, length: 45 })
  ciltTypeName: string | null;

  @Column("int", { name: "reference_opl_sop_id", nullable: true, unsigned: true })
  referenceOplSopId: number | null;

  @Column("int", { name: "standard_time", nullable: true, unsigned: true })
  standardTime: number | null;

  @Column("varchar", { name: "standard_ok", nullable: true, length: 100 })
  standardOk: string | null;

  @Column("int", { name: "remediation_opl_sop_id", nullable: true, unsigned: true })
  remediationOplSopId: number | null;

  @Column("text", { name: "tools_required", nullable: true })
  toolsRequired: string | null;

  @Column("tinyint", { name: "stoppage_reason", nullable: true })
  stoppageReason: number | null;

  @Column("tinyint", { name: "machine_stopped", default: 0, nullable: true })
  machineStopped: number | null;

  @Column("varchar", { 
    name: "special_warning", 
    nullable: true, 
    length: 100,
    comment: 'specifies if there is any special precaution, such as dangerous material, dangerous area, etc'
  })
  specialWarning: string | null;

  @Column("tinyint", { name: "quantity_pictures_create", default: 1, nullable: true })
  quantityPicturesCreate: number | null;

  @Column("tinyint", { name: "quantity_pictures_close", default: 1, nullable: true })
  quantityPicturesClose: number | null;

  @Column("tinyint", { name: "selectable_without_programming", nullable: true })
  selectableWithoutProgramming: number | null;

  @Column("char", { name: "status", nullable: true, length: 1, default: 'A' })
  status: string | null;

  @Column("timestamp", { name: "created_at", nullable: true, default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => CiltMstrEntity, (ciltMstr) => ciltMstr.sequences)
  @JoinColumn({ name: 'cilt_mstr_id' })
  ciltMstr: CiltMstrEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => CiltFrequenciesEntity)
  @JoinColumn({ name: 'frecuency_id' })
  frequency: CiltFrequenciesEntity;

  @OneToMany(() => CiltSequencesExecutionsEntity, (execution) => execution.ciltSequence)
  executions: CiltSequencesExecutionsEntity[];
}