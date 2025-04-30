import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cilt_secuencies_executions')
export class CiltSequencesExecutionsEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("int", {
    name: "position_id",
    nullable: true,
    comment: "comes from the positions table",
  })
  positionId: number | null;

  @Column("int", {
    name: "cilt_id",
    nullable: true,
    comment: "comes from the cilt_mstr table",
  })
  ciltId: number | null;

  @Column("int", {
    name: "cilt_details_id",
    nullable: true,
    comment: "comes from the cilt_details table",
  })
  ciltDetailsId: number | null;

  @Column("timestamp", {
    name: "secuence_start",
    nullable: true,
    comment: "moment when the sequence of the cilt starts",
  })
  secuenceStart: Date | null;

  @Column("timestamp", {
    name: "secuence_stop",
    nullable: true,
    comment: "moment when the sequence of the cilt ends",
  })
  secuenceStop: Date | null;

  @Column("int", {
    name: "duration",
    nullable: true,
    comment:
      "duration of the sequence execution in seconds: secuence_start - secuence_stop",
  })
  duration: number | null;

  @Column("varchar", {
    name: "standard_ok",
    nullable: true,
    comment: "standard to be fulfilled",
    length: 45,
  })
  standardOk: string | null;

  @Column("varchar", {
    name: "initial_parameter",
    nullable: true,
    comment:
      "parameter found, it is optional if there was any reading to be made",
    length: 45,
  })
  initialParameter: string | null;

  @Column("tinyint", {
    name: "evidence_at_creation",
    nullable: true,
    comment:
      "if evidence was captured at the beginning of the sequence, it is stored 1, otherwise it is stored 0; it is used to avoid a join to the cilt_secuencies_evidences table",
    default: () => "'0'",
  })
  evidenceAtCreation: number | null;

  @Column("varchar", {
    name: "final_parameter",
    nullable: true,
    comment:
      "final parameter, it is optional if there was any reading to be made",
    length: 45,
  })
  finalParameter: string | null;

  @Column("tinyint", {
    name: "evidence_at_final",
    nullable: true,
    comment:
      "if evidence was captured at the end of the sequence, it is stored 1, otherwise it is stored 0; it is used to avoid a join to the cilt_secuencies_evidences table",
    default: () => "'0'",
  })
  evidenceAtFinal: number | null;

  @Column("tinyint", {
    name: "stoppage_reason",
    nullable: true,
    comment:
      "indicates if finding NOK the sequence and not being able to take it to parameter OK is a stoppage reason",
  })
  stoppageReason: number | null;

  @Column("tinyint", {
    name: "am_tag",
    nullable: true,
    comment:
      "indicates if it has an AM card, it is used to avoid a join to the cards table",
    default: () => "'0'",
  })
  amTag: number | null;

  @Column("timestamp", { name: "created_at", nullable: true })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
