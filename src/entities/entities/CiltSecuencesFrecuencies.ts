import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("cilt_secuences_frecuencies", { schema: "railway" })
export class CiltSecuencesFrecuencies {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("int", { name: "position_id", nullable: true })
  positionId: number | null;

  @Column("int", { name: "cilt_id", nullable: true })
  ciltId: number | null;

  @Column("int", { name: "secuency_id", nullable: true })
  secuencyId: number | null;

  @Column("int", { name: "frecuency_id", nullable: true })
  frecuencyId: number | null;

  @Column("char", {
    name: "frecuency_code",
    nullable: true,
    comment:
      "inciales de la frecuencia: IT=inicio de turno; FT=fin de turno; CP=cambio de formato; RUN= maquina funcionando;",
    length: 3,
  })
  frecuencyCode: string | null;

  @Column("char", {
    name: "status",
    nullable: true,
    length: 1,
    default: () => "'A'",
  })
  status: string | null;
}
