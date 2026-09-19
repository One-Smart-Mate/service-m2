import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('auth_sessions')
@Index('idx_auth_sessions_user_active', ['userId', 'revokedAt'])
@Index('idx_auth_sessions_actor_active', ['actorId', 'revokedAt'])
@Index('idx_auth_sessions_parent', ['parentSessionId'])
export class AuthSessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ name: 'actor_id', type: 'int', unsigned: true, nullable: true })
  actorId?: number;

  @Column({
    name: 'parent_session_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  parentSessionId?: string;

  @Column({ name: 'session_type', type: 'varchar', length: 16 })
  sessionType: string;

  @Column({ type: 'varchar', length: 16 })
  platform: string;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
