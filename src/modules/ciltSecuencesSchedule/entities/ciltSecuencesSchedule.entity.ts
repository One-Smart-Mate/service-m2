import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cilt_secuences_schedule')
export class CiltSecuencesScheduleEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("int", { name: "cilt_id", nullable: true })
  ciltId: number | null;

  @Column("int", { name: "secuence_id", nullable: true })
  secuenceId: number | null;

  @Column("varchar", { name: "frecuency", nullable: true, length: 5 })
  frecuency: string | null;

  @Column("time", { name: "schedule", nullable: true, comment: 'Time format HH:mm:ss' })
  schedule: Date | null;

  @Column("varchar", { 
    name: "schedule_type", 
    nullable: true, 
    length: 3,
    comment: 'type of schedule: daily, weekly, monthly, yearly'
  })
  scheduleType: string | null;

  @Column("date", { name: "end_date", nullable: true, comment: 'Date format YYYY-MM-DD' })
  endDate: Date | null;

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

  @Column("tinyint", { 
    name: "day_of_month", 
    nullable: true,
    comment: 'stores the day of the month that the sequence is executed'
  })
  dayOfMonth: number | null;

  @Column("tinyint", { 
    name: "week_of_month", 
    nullable: true,
    comment: 'if you program repetitions for example: third week of each month, here the number of the week of the month is stored'
  })
  weekOfMonth: number | null;

  @Column("date", { 
    name: "date_of_year", 
    nullable: true,
    comment: 'if the schedule is yearly, then here the date is stored in which the sequence has to be executed each year'
  })
  dateOfYear: Date | null;

  @Column("tinyint", { 
    name: "month_of_year", 
    nullable: true,
    comment: 'month of the year to evaluate for sequences that are executed on a specific day of a month, regardless of the date'
  })
  monthOfYear: number | null;

  @Column("char", { 
    name: "status", 
    nullable: true, 
    length: 1,
    default: () => "'A'"
  })
  status: string | null;

  @Column("timestamp", { name: "created_at", nullable: true })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
} 