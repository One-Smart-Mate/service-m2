import { SiteEntity } from 'src/modules/site/entities/site.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('am_discard_reasons')
export class AmDiscardReasonEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({
    type: 'int',
    unsigned: true,
    name: 'site_id',
    nullable: true,
    comment: 'The site this reason belongs to. If null, it is a global reason.',
  })
  siteId: number | null;

  @Column({
    type: 'varchar',
    length: 45,
    name: 'discard_reason',
    nullable: true,
    comment: 'Reason for discarding a card.',
  })
  discardReason: string | null;

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
} 