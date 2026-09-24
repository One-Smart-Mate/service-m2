import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationOutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  SENT = 'SENT',
  DEAD = 'DEAD',
}

export type NotificationAudience =
  | { type: 'user'; userId: number }
  | { type: 'users'; userIds: number[] }
  | { type: 'site'; siteId: number; excludeWeb?: boolean }
  | { type: 'site-except-user'; siteId: number; excludedUserId: number }
  | { type: 'all-users' };

export interface NotificationOutboxPayload {
  audience: NotificationAudience;
  notification: {
    title: string;
    description: string;
    type: string;
  };
}

@Entity('notification_outbox')
@Index('uq_notification_outbox_deduplication_key', ['deduplicationKey'], {
  unique: true,
})
@Index('idx_notification_outbox_ready', ['status', 'availableAt'])
export class NotificationOutboxEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({
    type: 'varchar',
    length: 191,
    name: 'deduplication_key',
  })
  deduplicationKey: string;

  @Column({ type: 'json' })
  payload: NotificationOutboxPayload;

  @Column({
    type: 'enum',
    enum: NotificationOutboxStatus,
    default: NotificationOutboxStatus.PENDING,
  })
  status: NotificationOutboxStatus;

  @Column({ type: 'int', unsigned: true, default: 0 })
  attempts: number;

  @Column({ type: 'datetime', precision: 6, name: 'available_at' })
  availableAt: Date;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    name: 'locked_at',
  })
  lockedAt: Date | null;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    name: 'sent_at',
  })
  sentAt: Date | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'last_error',
  })
  lastError: string | null;

  @Column({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;
}
