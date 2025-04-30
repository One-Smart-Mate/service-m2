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
      "Frequency acronyms: IT=Start of shift; FT=End of shift; CP=Format change; RUN=Machine running;",
    length: 3,
  })
  frecuencyCode: string | null;

  @Column("varchar", {
    name: "description",
    nullable: true,
    comment: "Frequency description",
    length: 45,
  })
  description: string | null;

  @Column("varchar", {
    name: "status",
    nullable: true,
    comment: "A= Active; I=Inactive",
    length: 45,
    default: () => "'A'",
  })
  status: string | null;
}
