import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity("cilt_frecuencies")
export class CiltFrequenciesEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("char", {
    name: "frecuency_code",
    nullable: true,
    comment:
      "siglas de la frecuencia: IT=Inicio de turno; FT=Fin de turno; CP=Cambio de formato; RUN=Maquina funcionando;",
    length: 3,
  })
  frecuencyCode: string | null;

  @Column("varchar", {
    name: "description",
    nullable: true,
    comment: "descripcion de la frecuencia",
    length: 45,
  })
  description: string | null;

  @Column("varchar", {
    name: "status",
    nullable: true,
    comment: "A= Activo",
    length: 45,
    default: () => "'A'",
  })
  status: string | null;
}
