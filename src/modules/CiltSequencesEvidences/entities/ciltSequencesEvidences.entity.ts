import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cilt_secuencies_evidences')
export class CiltSequencesEvidencesEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("int", { name: "position_id", nullable: true })
  positionId: number | null;

  @Column("int", { name: "cilt_id", nullable: true })
  ciltId: number | null;

  @Column("int", { name: "cilt_executions_evidences_id", nullable: true })
  ciltExecutionsEvidencesId: number | null;

  @Column("varchar", {
    name: "evidence_url",
    nullable: true,
    comment: "URL donde se almacena la imagen de evidencia",
    length: 500,
  })
  evidenceUrl: string | null;

  @Column("timestamp", { name: "created_at", nullable: true })
  createdAt: Date | null;
}
