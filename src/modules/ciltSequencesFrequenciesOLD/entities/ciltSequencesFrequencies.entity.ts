import { Entity, PrimaryGeneratedColumn, Column, } from 'typeorm';

@Entity('cilt_sequences_frequencies_OLD')
export class CiltSequencesFrequenciesEntity {
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
      "initiales of the frequency: IT=start of shift; FT=end of shift; CP=format change; RUN=machine running;",
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