import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CiltMstrEntity } from '../../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../../ciltSequences/entities/ciltSequences.entity';
import { SiteEntity } from '../../site/entities/site.entity';
import { ScheduleType } from 'src/utils/string.constant';

@Entity('cilt_secuences_schedule')
export class CiltSecuencesScheduleEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("int", { name: "cilt_id", nullable: true, unsigned: true })
  ciltId: number | null;

  @Column("int", { name: "secuence_id", nullable: true, unsigned: true })
  secuenceId: number | null;

  @Column("tinyint", { name: "order", default: 1, nullable: false })
  order: number;

  @Column("char", { name: "frecuency", nullable: true, length: 5 })
  frecuency: string | null;

  @Column("time", { name: "schedule", nullable: true })
  schedule: string | null;

  @Column("char", { 
    name: "schedule_type", 
    nullable: true, 
    length: 3
  })
  scheduleType: ScheduleType | null;

  @Column("date", { name: "end_date", nullable: true })
  endDate: string | null;

  @Column("tinyint", { name: "mon", nullable: true, default: 0 })
  mon: number | null;

  @Column("tinyint", { name: "tue", nullable: true, default: 0 })
  tue: number | null;

  @Column("tinyint", { name: "wed", nullable: true, default: 0 })
  wed: number | null;

  @Column("tinyint", { name: "thu", nullable: true, default: 0 })
  thu: number | null;

  @Column("tinyint", { name: "fri", nullable: true, default: 0 })
  fri: number | null;

  @Column("tinyint", { name: "sat", nullable: true, default: 0 })
  sat: number | null;

  @Column("tinyint", { name: "sun", nullable: true, default: 0 })
  sun: number | null;

  @Column("tinyint", { name: "day_of_month", nullable: true })
  dayOfMonth: number | null;

  @Column("tinyint", { name: "week_of_month", nullable: true })
  weekOfMonth: number | null;

  @Column("date", { name: "date_of_year", nullable: true })
  dateOfYear: string | null;

  @Column("tinyint", { name: "month_of_year", nullable: true })
  monthOfYear: number | null;

  @Column("tinyint", { name: "allow_execute_before", nullable: true, default: 1 })
  allowExecuteBefore: number | null;

  @Column("tinyint", { name: "allow_execute_before_minutes", nullable: true })
  allowExecuteBeforeMinutes: number | null;

  @Column("tinyint", { name: "tolerance_before_minutes", nullable: true })
  toleranceBeforeMinutes: number | null;

  @Column("tinyint", { name: "tolerance_after_minutes", nullable: true })
  toleranceAfterMinutes: number | null;

  @Column("tinyint", { name: "allow_execute_after_due", nullable: true })
  allowExecuteAfterDue: number | null;

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

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => CiltMstrEntity)
  @JoinColumn({ name: 'cilt_id' })
  cilt: CiltMstrEntity;

  @ManyToOne(() => CiltSequencesEntity)
  @JoinColumn({ name: 'secuence_id' })
  sequence: CiltSequencesEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;
}