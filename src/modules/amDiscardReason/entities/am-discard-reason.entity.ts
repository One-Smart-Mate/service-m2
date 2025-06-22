import { SiteEntity } from 'src/modules/site/entities/site.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;
} 