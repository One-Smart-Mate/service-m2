import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CiltSecuences } from "./CiltSecuences";

@Entity("repository", { schema: "railway" })
export class Repository {
  @PrimaryGeneratedColumn({ type: "int", name: "ID", unsigned: true })
  id: number;

  @Column("varchar", { name: "evidence_name", length: 255 })
  evidenceName: string;

  @Column("varchar", { name: "evidence_type", length: 10 })
  evidenceType: string;

  @Column("char", { name: "status", length: 1, default: () => "'A'" })
  status: string;

  @Column("timestamp", {
    name: "created_at",
    default: () => "'CURRENT_TIMESTAMP(6)'",
  })
  createdAt: Date;

  @Column("timestamp", {
    name: "updated_at",
    default: () => "'CURRENT_TIMESTAMP(6)'",
  })
  updatedAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => CiltSecuences,
    (ciltSecuences) => ciltSecuences.repositories,
    { onDelete: "CASCADE", onUpdate: "NO ACTION" }
  )
  @JoinColumn([{ name: "cilt_id", referencedColumnName: "id" }])
  cilt: CiltSecuences;
}
