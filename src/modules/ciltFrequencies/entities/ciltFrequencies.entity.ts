import { CiltSequencesEntity } from '../../ciltSequences/entities/ciltSequences.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';


@Entity("cilt_frecuencies")
export class CiltFrequenciesEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("char", { name: "frecuency_code", nullable: true, length: 5 })
  frecuencyCode: string | null;

  @Column("varchar", { name: "description", nullable: true, length: 45 })
  description: string | null;

  @Column("varchar", { name: "status", nullable: true, length: 45, default: 'A' })
  status: string | null;

  @Column("tinyint", { name: "schedule", nullable: true })
  schedule: number | null;

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

  @OneToMany(() => CiltSequencesEntity, (ciltSequences) => ciltSequences.frequency)
  ciltSequences: CiltSequencesEntity[];
}