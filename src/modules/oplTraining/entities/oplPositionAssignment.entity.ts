import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { PositionEntity } from 'src/modules/position/entities/position.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

/**
 * Links an OPL (course) to a position. Every user that belongs to the
 * position is required to take the OPL, which materializes as rows in
 * {@link OplTrainingRecordEntity}.
 */
@Entity('opl_position_assignment')
export class OplPositionAssignmentEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'bigint', unsigned: true, nullable: true })
  siteId: number | null;

  @Column({ name: 'opl_id', type: 'int', unsigned: true })
  oplId: number;

  @Column({ name: 'position_id', type: 'int', unsigned: true })
  positionId: number;

  @ManyToOne(() => OplMstr)
  @JoinColumn({ name: 'opl_id' })
  opl: OplMstr;

  @ManyToOne(() => PositionEntity)
  @JoinColumn({ name: 'position_id' })
  position: PositionEntity;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;

  @Exclude()
  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Exclude()
  @Column({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
