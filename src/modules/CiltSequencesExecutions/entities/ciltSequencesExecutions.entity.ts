import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../../ciltSequences/entities/ciltSequences.entity';
import { LevelEntity } from '../../level/entities/level.entity';
import { PositionEntity } from '../../position/entities/position.entity';
import { SiteEntity } from '../../site/entities/site.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { OplMstr } from '../../oplMstr/entities/oplMstr.entity';
import { CiltSequencesEvidencesEntity } from '../../CiltSequencesEvidences/entities/ciltSequencesEvidences.entity';

@Entity('cilt_secuencies_executions')
export class CiltSequencesExecutionsEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("int", { name: "position_id", nullable: true, unsigned: true })
  positionId: number | null;

  @Column("int", { name: "cilt_id", nullable: true, unsigned: true })
  ciltId: number | null;

  @Column("int", { name: "cilt_secuence_id", nullable: true, unsigned: true })
  ciltSecuenceId: number | null;

  @Column("int", { name: "level_id", nullable: true, unsigned: true })
  levelId: number | null;

  @Column("varchar", { name: "route", nullable: true, length: 250 })
  route: string | null;

  @Column("int", { name: "user_id", nullable: true, unsigned: true })
  userId: number | null;

  @Column("int", { name: "user_who_executed_id", nullable: true, unsigned: true })
  userWhoExecutedId: number | null;

  @Column("datetime", { name: "secuence_schedule", nullable: true })
  secuenceSchedule: Date | null;

  @Column("tinyint", { name: "allow_execute_before", nullable: true })
  allowExecuteBefore: number | null;

  @Column("tinyint", { name: "allow_execute_before_minutes", nullable: true })
  allowExecuteBeforeMinutes: number | null;

  @Column("tinyint", { name: "tolerance_before_minutes", nullable: true })
  toleranceBeforeMinutes: number | null;

  @Column("tinyint", { name: "tolerance_after_minutes", nullable: true })
  toleranceAfterMinutes: number | null;

  @Column("tinyint", { name: "allow_execute_after_due", nullable: true })
  allowExecuteAfterDue: number | null;

  @Column("timestamp", { name: "secuence_start", nullable: true })
  secuenceStart: Date | null;

  @Column("timestamp", { name: "secuence_stop", nullable: true })
  secuenceStop: Date | null;

  @Column("int", { name: "duration", nullable: true })
  duration: number | null;

  @Column("int", { name: "real_duration", nullable: true })
  realDuration: number | null;

  @Column("varchar", { name: "standard_ok", nullable: true, length: 45 })
  standardOk: string | null;

  @Column("varchar", { name: "initial_parameter", nullable: true, length: 45 })
  initialParameter: string | null;

  @Column("tinyint", { name: "evidence_at_creation", nullable: true, default: 0 })
  evidenceAtCreation: number | null;

  @Column("varchar", { name: "final_parameter", nullable: true, length: 45 })
  finalParameter: string | null;

  @Column("tinyint", { name: "evidence_at_final", nullable: true, default: 0 })
  evidenceAtFinal: number | null;

  @Column("tinyint", { name: "nok", nullable: true, default: 0 })
  nok: number | null;

  @Column("tinyint", { name: "stoppage_reason", nullable: true })
  stoppageReason: number | null;

  @Column("tinyint", { name: "machine_stopped", nullable: true })
  machineStopped: number | null;

  @Column("int", { name: "am_tag_id", nullable: true, default: 0 })
  amTagId: number | null;

  @Column("char", { name: "reference_point", nullable: true, length: 10 })
  referencePoint: string | null;

  @Column("text", { name: "secuence_list", nullable: true })
  secuenceList: string | null;

  @Column("char", { name: "secuence_color", nullable: true, length: 6 })
  secuenceColor: string | null;

  @Column("int", { name: "cilt_type_id", nullable: true, unsigned: true })
  ciltTypeId: number | null;

  @Column("varchar", { name: "cilt_type_name", nullable: true, length: 45 })
  ciltTypeName: string | null;

  @Column("int", { name: "reference_opl_sop_id", nullable: true, unsigned: true })
  referenceOplSopId: number | null;

  @Column("int", { name: "remediation_opl_sop_id", nullable: true, unsigned: true })
  remediationOplSopId: number | null;

  @Column("text", { name: "tools_requiered", nullable: true })
  toolsRequiered: string | null;

  @Column("tinyint", { name: "selectable_without_programming", nullable: true })
  selectableWithoutProgramming: number | null;

  @Column("char", { name: "status", nullable: true, length: 1, default: 'A' })
  status: string | null;

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

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => PositionEntity)
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity;

  @ManyToOne(() => CiltMstrEntity)
  @JoinColumn({ name: 'cilt_id' })
  cilt: CiltMstrEntity;

  @ManyToOne(() => CiltSequencesEntity)
  @JoinColumn({ name: 'cilt_secuence_id' })
  ciltSequence: CiltSequencesEntity;

  @ManyToOne(() => LevelEntity)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_who_executed_id' })
  userWhoExecuted: UserEntity;

  @ManyToOne(() => OplMstr, (opl) => opl.referenceExecutions)
  @JoinColumn({ name: 'reference_opl_sop_id' })
  referenceOplSop: OplMstr;

  @ManyToOne(() => OplMstr, (opl) => opl.remediationExecutions)
  @JoinColumn({ name: 'remediation_opl_sop_id' })
  remediationOplSop: OplMstr;

  @OneToMany(() => CiltSequencesEvidencesEntity, (evidence) => evidence.ciltExecutionsEvidences)
  evidences: CiltSequencesEvidencesEntity[];
}