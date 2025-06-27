import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../../ciltSequences/entities/ciltSequences.entity';
import { LevelEntity } from '../../level/entities/level.entity';
import { PositionEntity } from '../../position/entities/position.entity';
import { SiteEntity } from '../../site/entities/site.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { OplMstr } from '../../oplMstr/entities/oplMstr.entity';
import { CiltSequencesExecutionsEvidencesEntity } from '../../CiltSequencesExecutionsEvidences/entities/ciltSequencesExecutionsEvidences.entity';

@Entity('cilt_sequences_executions', {
  comment: 'Save the information of the sequences when executing a CILT procedure, a record is generated for each frequency when a CILT is generated; it specifies the date/time when it should be executed'
})
@Index("fk_cilt_executions_level_id_idx", ["levelId"])
@Index("fk_cilt_executions_position_id_idx", ["positionId"])
@Index("fk_cilt_executions_reference_opl_id_idx", ["referenceOplSopId"])
@Index("fk_cilt_executions_remediation_sop_id_idx", ["remediationOplSopId"])
@Index("fk_cilt_executions_site_id_idx", ["siteId"])
@Index("fk_cilt_executions_user_id_idx", ["userId"])
@Index("fk_cilt_executions_user_who_executed_id_idx", ["userWhoExecutedId"])
export class CiltSequencesExecutionsEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { 
    name: "site_id", 
    nullable: true, 
    unsigned: true 
  })
  siteId: number | null;

  @Column("int", { 
    name: "site_execution_id", 
    nullable: true, 
    unsigned: true,
    comment: 'unique id of the site to keep track of its own ids'
  })
  siteExecutionId: number | null;

  @Column("int", { 
    name: "position_id", 
    nullable: true, 
    unsigned: true,
    comment: 'comes from the positions table'
  })
  positionId: number | null;

  @Column("int", { 
    name: "cilt_id", 
    nullable: true, 
    unsigned: true,
    comment: 'comes from the cilt_mstr table'
  })
  ciltId: number | null;

  @Column("int", { 
    name: "cilt_secuence_id", 
    nullable: true, 
    unsigned: true,
    comment: 'comes from the cilt_details table'
  })
  ciltSecuenceId: number | null;

  @Column("int", { 
    name: "level_id", 
    nullable: true, 
    unsigned: true,
    comment: 'node where the sequence was executed'
  })
  levelId: number | null;

  @Column("varchar", { 
    name: "route", 
    nullable: true, 
    length: 250,
    comment: 'route to where the sequence was assigned /area/line/machine'
  })
  route: string | null;

  @Column("int", { 
    name: "user_id", 
    nullable: true, 
    unsigned: true,
    comment: 'user that has assigned the sequence execution'
  })
  userId: number | null;

  @Column("int", { 
    name: "user_who_executed_id", 
    nullable: true, 
    unsigned: true,
    comment: 'user that executed the sequence, it could be different from the user assigned to the sequence or not'
  })
  userWhoExecutedId: number | null;

  @Column("varchar", { 
    name: "special_warning", 
    nullable: true, 
    length: 100,
    comment: 'specifies if there is any special precaution, such as dangerous material, dangerous area, etc'
  })
  specialWarning: string | null;
  
  @Column("enum", { 
    name: "machine_status", 
    nullable: true,
    enum: ['running', 'stop'],
    comment: 'indicates if the machine is running or stopped'
  })
  machineStatus: 'running' | 'stop' | null;

  @Column("datetime", { 
    name: "secuence_schedule", 
    nullable: true,
    comment: 'stores the date and time when the sequence was scheduled to be executed'
  })
  secuenceSchedule: Date | null;

  @Column("boolean", { 
    name: "allow_execute_before", 
    nullable: true,
    comment: 'specifies if it is allowed to execute the task before the specified time SI/NO'
  })
  allowExecuteBefore: boolean | null;

  @Column("tinyint", { 
    name: "allow_execute_before_minutes", 
    nullable: true,
    comment: 'specifies the minutes that can be executed previously'
  })
  allowExecuteBeforeMinutes: number | null;

  @Column("tinyint", { 
    name: "tolerance_before_minutes", 
    nullable: true,
    comment: 'tolerance minutes before to consider that the execution is on time'
  })
  toleranceBeforeMinutes: number | null;

  @Column("tinyint", { 
    name: "tolerance_after_minutes", 
    nullable: true,
    comment: 'tolerance minutes after to consider that the execution is delayed'
  })
  toleranceAfterMinutes: number | null;

  @Column("boolean", { 
    name: "allow_execute_after_due", 
    nullable: true,
    comment: 'specifies if the task can be executed after it is due'
  })
  allowExecuteAfterDue: boolean | null;

  @Column("timestamp", { 
    name: "secuence_start", 
    nullable: true,
    comment: 'moment when the sequence of the cilt starts'
  })
  secuenceStart: Date | null;

  @Column("timestamp", { 
    name: "secuence_stop", 
    nullable: true,
    comment: 'moment when the sequence of the cilt stops'
  })
  secuenceStop: Date | null;

  @Column("int", { 
    name: "duration", 
    nullable: true,
    comment: 'duration of the sequence execution in seconds'
  })
  duration: number | null;

  @Column("int", { 
    name: "real_duration", 
    nullable: true,
    comment: 'real duration of the sequence execution, stored in seconds'
  })
  realDuration: number | null;

  @Column("varchar", { 
    name: "standard_ok", 
    nullable: true, 
    length: 45,
    comment: 'standard that must be met'
  })
  standardOk: string | null;

  @Column("varchar", { 
    name: "initial_parameter", 
    nullable: true, 
    length: 45,
    comment: 'parameter found, it is optional if there was any reading to perform'
  })
  initialParameter: string | null;

  @Column("boolean", { 
    name: "evidence_at_creation", 
    nullable: true, 
    default: false,
    comment: 'if evidence was captured at the beginning of the sequence'
  })
  evidenceAtCreation: boolean | null;

  @Column("varchar", { 
    name: "final_parameter", 
    nullable: true, 
    length: 45,
    comment: 'parameter at the end, it is optional if there was any reading to perform'
  })
  finalParameter: string | null;

  @Column("boolean", { 
    name: "evidence_at_final", 
    nullable: true, 
    default: false,
    comment: 'if evidence was captured at the end of the sequence'
  })
  evidenceAtFinal: boolean | null;

  @Column("boolean", { 
    name: "nok", 
    nullable: true, 
    default: false,
    comment: 'indicates if the found parameter was OK or NOK'
  })
  nok: boolean | null;

  @Column("boolean", { 
    name: "stoppage_reason", 
    nullable: true,
    comment: 'indicates if finding NOK is a stoppage reason'
  })
  stoppageReason: boolean | null;

  @Column("boolean", { 
    name: "machine_stopped", 
    nullable: true,
    comment: 'specifies if this sequence must be executed with the machine stopped'
  })
  machineStopped: boolean | null;

  @Column("int", { 
    name: "am_tag_id", 
    nullable: true, 
    default: 0,
    comment: 'If the execution generated an AM card, here the id is stored'
  })
  amTagId: number | null;

  @Column("char", { 
    name: "reference_point", 
    nullable: true, 
    length: 10,
    comment: 'reference number or letter that corresponds to a number or letter in the diagram'
  })
  referencePoint: string | null;

  @Column("text", { 
    name: "secuence_list", 
    nullable: true,
    comment: 'sequence of steps to follow, it is a text with format'
  })
  secuenceList: string | null;

  @Column("char", { 
    name: "secuence_color", 
    nullable: true, 
    length: 6,
    comment: 'sequence color in hexadecimal'
  })
  secuenceColor: string | null;

  @Column("int", { 
    name: "cilt_type_id", 
    nullable: true, 
    unsigned: true,
    comment: 'type of CILT to execute, comes from the cilt_types table'
  })
  ciltTypeId: number | null;

  @Column("varchar", { 
    name: "cilt_type_name", 
    nullable: true, 
    length: 45 
  })
  ciltTypeName: string | null;

  @Column("int", { 
    name: "reference_opl_sop_id", 
    nullable: true, 
    unsigned: true,
    comment: 'id of the reference opl'
  })
  referenceOplSopId: number | null;

  @Column("int", { 
    name: "remediation_opl_sop_id", 
    nullable: true, 
    unsigned: true,
    comment: 'id of the remediation opl'
  })
  remediationOplSopId: number | null;

  @Column("text", { 
    name: "tools_requiered", 
    nullable: true,
    comment: 'tools required'
  })
  toolsRequiered: string | null;

  @Column("boolean", { 
    name: "selectable_without_programming", 
    nullable: true,
    comment: 'Indicates if a sequence can be deployed to be executed without being scheduled'
  })
  selectableWithoutProgramming: boolean | null;

  @Column("char", { 
    name: "status", 
    nullable: true, 
    length: 1, 
    default: 'A' 
  })
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

  @Column("timestamp", { 
    name: "deleted_at", 
    nullable: true 
  })
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

  @OneToMany(() => CiltSequencesExecutionsEvidencesEntity, (evidence) => evidence.ciltSequencesExecutions)
  evidences: CiltSequencesExecutionsEvidencesEntity[];
}