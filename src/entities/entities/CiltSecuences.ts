import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Repository } from "./Repository";

@Entity("cilt_secuences", { schema: "railway" })
export class CiltSecuences {
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
    comment: "heredada de positions",
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
    comment: "nodo final donde se crea la secuencia",
  })
  levelId: number | null;

  @Column("varchar", { name: "level_name", nullable: true, length: 45 })
  levelName: string | null;

  @Column("tinyint", {
    name: "order",
    nullable: true,
    comment: "orden en el que se muestran las secuencias",
  })
  order: number | null;

  @Column("text", {
    name: "secuence_list",
    nullable: true,
    comment:
      "secuencia de pasos a seguir, es un texto con formato, pueden ser un listado",
  })
  secuenceList: string | null;

  @Column("char", {
    name: "secuence_color",
    nullable: true,
    comment: "color de la secuencia en hexadecimal",
    length: 6,
  })
  secuenceColor: string | null;

  @Column("int", {
    name: "cilt_type_id",
    nullable: true,
    comment:
      "tipo de CILT a ejecutar, viene de la tabla cilt_types; una secuencia solo puede tener un tipo de cilt",
  })
  ciltTypeId: number | null;

  @Column("varchar", { name: "cilt_type_name", nullable: true, length: 45 })
  ciltTypeName: string | null;

  @Column("int", {
    name: "reference_opl_sop",
    nullable: true,
    comment: "viene de la tabla opl_mstr",
  })
  referenceOplSop: number | null;

  @Column("int", {
    name: "standard_time",
    nullable: true,
    comment:
      "tiempo de ejecucion de la secuencia; se captura en segundos, se muestra en lenguaje natural",
  })
  standardTime: number | null;

  @Column("varchar", {
    name: "standard_ok",
    nullable: true,
    comment: "texto simple que indica cual es el standard esperado o a cumplir",
    length: 100,
  })
  standardOk: string | null;

  @Column("int", {
    name: "remediation_opl_sop",
    nullable: true,
    comment: "viene de la tabla opl_mstr",
  })
  remediationOplSop: number | null;

  @Column("text", {
    name: "tools_required",
    nullable: true,
    comment:
      "texto simple, herramientas necesarias para llevar a cabo las tareas",
  })
  toolsRequired: string | null;

  @Column("tinyint", {
    name: "stoppage_reason",
    nullable: true,
    comment: "SI/NO si no se cumple el standar es motivo de paro?",
  })
  stoppageReason: number | null;

  @Column("tinyint", {
    name: "quantity_pictures_create",
    nullable: true,
    comment:
      "cantidad de imagenes al inicio de la secuencia para respaldar el status en que se encontro el equipo, default 1",
    default: () => "'1'",
  })
  quantityPicturesCreate: number | null;

  @Column("tinyint", {
    name: "quantity_pictures_close",
    nullable: true,
    comment:
      "cantidad de imagenes al termino de la secuencia para respaldar el status en que se dejo el equipo, default 1",
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

  @OneToMany(() => Repository, (repository) => repository.cilt)
  repositories: Repository[];
}
