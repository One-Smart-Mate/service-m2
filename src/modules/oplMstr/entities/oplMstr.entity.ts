import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn
} from "typeorm";
import { SiteEntity } from '../../site/entities/site.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { OplDetailsEntity } from '../../oplDetails/entities/oplDetails.entity';
import { CiltSequencesExecutionsEntity } from '../../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';

@Entity("opl_mstr")
export class OplMstr {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("varchar", { name: "title", length: 100 })
  title: string;

  @Column("varchar", { name: "objetive", nullable: true, length: 255 })
  objetive: string | null;

  @Column("int", { name: "creator_id", nullable: true, unsigned: true })
  creatorId: number | null;

  @Column("varchar", { name: "creator_name", nullable: true, length: 100 })
  creatorName: string | null;

  @Column("int", { name: "reviewer_id", nullable: true, unsigned: true })
  reviewerId: number | null;

  @Column("varchar", { name: "reviewer_name", nullable: true, length: 100 })
  reviewerName: string | null;

  @Column("enum", { name: "opl_type", nullable: true, enum: ["opl", "sop"] })
  oplType: "opl" | "sop" | null;

  @Column("tinyint", { name: "order", default: 1, nullable: false })
  order: number;

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

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: UserEntity;

  @OneToMany(() => OplDetailsEntity, (detail) => detail.opl)
  details: OplDetailsEntity[];

  @OneToMany(() => CiltSequencesExecutionsEntity, (execution) => execution.referenceOplSop)
  referenceExecutions: CiltSequencesExecutionsEntity[];

  @OneToMany(() => CiltSequencesExecutionsEntity, (execution) => execution.remediationOplSop)
  remediationExecutions: CiltSequencesExecutionsEntity[];
}