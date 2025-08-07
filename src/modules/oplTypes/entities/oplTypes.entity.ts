import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  OneToMany
} from "typeorm";
import { OplMstr } from "src/modules/oplMstr/entities/oplMstr.entity";
@Entity("opl_types")
export class OplTypes {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { 
    name: "document_type", 
    nullable: true, 
    length: 50,
    comment: "Type of document: OPL, OPL for improvement, security OPL, basic knowledge OPL, SOP, etc."
  })
  documentType: string | null;

  @Column("char", { 
    name: "status", 
    nullable: true, 
    length: 1,
    default: "A"
  })
  status: string | null;

  @Column("datetime", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt: Date | null;

  @Column("datetime", {
    name: "updated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP"
  })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => OplMstr, (opl) => opl.oplTypeRelation)
  opls: OplMstr[];
}
