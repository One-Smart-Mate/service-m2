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
    comment: "viene de la tabla posiciones",
  })
  positionId: number | null;

  @Column("int", {
    name: "cilt_id",
    nullable: true,
    comment: "viene de la tabla cilt_mstr",
  })
  ciltId: number | null;

  @Column("int", {
    name: "cilt_details_id",
    nullable: true,
    comment: "viene de la tabla cilt_details",
  })
  ciltDetailsId: number | null;

  @Column("timestamp", {
    name: "secuence_start",
    nullable: true,
    comment: "momento en que inicia la secuencia del cilt",
  })
  secuenceStart: Date | null;

  @Column("timestamp", {
    name: "secuence_stop",
    nullable: true,
    comment: "momento en que termina la secuencia del cilt",
  })
  secuenceStop: Date | null;

  @Column("int", {
    name: "duration",
    nullable: true,
    comment:
      "duracion de la ejecucion de la secuencia en segundos: secuence_start - secuence_stop",
  })
  duration: number | null;

  @Column("varchar", {
    name: "standard_ok",
    nullable: true,
    comment: "estandar que se debe cumplir",
    length: 45,
  })
  standardOk: string | null;

  @Column("varchar", {
    name: "initial_parameter",
    nullable: true,
    comment:
      "parametro que se encontro, es opcional si habia alguna lectura a efectuar",
    length: 45,
  })
  initialParameter: string | null;

  @Column("tinyint", {
    name: "evidence_at_creation",
    nullable: true,
    comment:
      "si se capturo evidencia al inicio de la secuencia, se almacena 1, sino se almacena 0; sirve para evitar un join a la tabla cilt_secuencies_evidences",
    default: () => "'0'",
  })
  evidenceAtCreation: number | null;

  @Column("varchar", {
    name: "final_parameter",
    nullable: true,
    comment:
      "parametro en final, es opcional si habia alguna lectura a efectuar",
    length: 45,
  })
  finalParameter: string | null;

  @Column("tinyint", {
    name: "evidence_at_final",
    nullable: true,
    comment:
      "si se capturo evidencia al final de la secuencia, se almacena 1, sino se almacena 0; sirve para evitar un join a la tabla cilt_secuencies_evidences",
    default: () => "'0'",
  })
  evidenceAtFinal: number | null;

  @Column("tinyint", {
    name: "stoppage_reason",
    nullable: true,
    comment:
      "indica si encontrar NOK la secuencia y no poder llevarla a parametro OK es motivo de paro",
  })
  stoppageReason: number | null;

  @Column("tinyint", {
    name: "am_tag",
    nullable: true,
    comment:
      "indica si tiene una tarjeta de am, se utiliza para evitar un join a la tabla de cards",
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
