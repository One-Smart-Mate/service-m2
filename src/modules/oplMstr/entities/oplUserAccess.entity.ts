import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Tracks each user's access to an OPL: how many times they have opened it
 * and the last time they did. One row per (user, opl) pair.
 */
@Entity('opl_user_access')
@Unique('uq_opl_user', ['userId', 'oplId'])
@Index('idx_opl_user_access_user', ['userId'])
export class OplUserAccessEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'opl_id', type: 'int', unsigned: true })
  oplId: number;

  @Column({ name: 'site_id', type: 'bigint', unsigned: true, nullable: true })
  siteId: number | null;

  @Column({ name: 'access_count', type: 'int', unsigned: true, default: 1 })
  accessCount: number;

  @Column({
    name: 'last_access_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastAccessAt: Date | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;
}
