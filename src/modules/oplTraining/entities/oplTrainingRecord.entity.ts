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
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { PositionEntity } from 'src/modules/position/entities/position.entity';
import { SiteEntity } from 'src/modules/site/entities/site.entity';

/**
 * Training lifecycle for a single (user, OPL) pair. One row per user that
 * must take an OPL. The matrix (user x course) is built from these rows.
 *
 * status flow:
 *   PENDING          -> assigned, not taken yet
 *   SELF_COMPLETED   -> the user marked it as taken, waiting supervisor validation
 *   VALIDATED        -> supervisor confirmed; expires_at set from OPL.validityDays
 *   EXPIRED          -> validity elapsed; user must take it again
 */
export enum OplTrainingStatus {
  PENDING = 'PENDING',
  SELF_COMPLETED = 'SELF_COMPLETED',
  VALIDATED = 'VALIDATED',
  EXPIRED = 'EXPIRED',
}

@Entity('opl_training_record')
export class OplTrainingRecordEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column({ name: 'site_id', type: 'bigint', unsigned: true, nullable: true })
  siteId: number | null;

  @Column({ name: 'opl_id', type: 'int', unsigned: true })
  oplId: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ name: 'position_id', type: 'int', unsigned: true, nullable: true })
  positionId: number | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: OplTrainingStatus.PENDING,
  })
  status: OplTrainingStatus;

  @Column({ name: 'self_completed_at', type: 'datetime', nullable: true })
  selfCompletedAt: Date | null;

  @Column({ name: 'validated_at', type: 'datetime', nullable: true })
  validatedAt: Date | null;

  @Column({ name: 'validated_by', type: 'int', unsigned: true, nullable: true })
  validatedBy: number | null;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'expiry_notified_at', type: 'datetime', nullable: true })
  expiryNotifiedAt: Date | null;

  @ManyToOne(() => OplMstr)
  @JoinColumn({ name: 'opl_id' })
  opl: OplMstr;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

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
