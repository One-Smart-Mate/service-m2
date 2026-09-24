import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  NotificationOutboxEntity,
  NotificationOutboxPayload,
  NotificationOutboxStatus,
} from './entities/notification-outbox.entity';

export interface EnqueueNotification {
  deduplicationKey: string;
  payload: NotificationOutboxPayload;
}

@Injectable()
export class NotificationOutboxService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async enqueue(
    input: EnqueueNotification,
  ): Promise<NotificationOutboxEntity> {
    try {
      return await this.dataSource.transaction((manager) =>
        this.enqueueWithManager(manager, input),
      );
    } catch (error) {
      if (!this.isDuplicateEntry(error)) {
        throw error;
      }

      return this.dataSource
        .getRepository(NotificationOutboxEntity)
        .findOneByOrFail({ deduplicationKey: input.deduplicationKey });
    }
  }

  enqueueWithManager(
    manager: EntityManager,
    input: EnqueueNotification,
  ): Promise<NotificationOutboxEntity> {
    const now = new Date();
    const event = manager.create(NotificationOutboxEntity, {
      deduplicationKey: input.deduplicationKey,
      payload: input.payload,
      status: NotificationOutboxStatus.PENDING,
      attempts: 0,
      availableAt: now,
      lockedAt: null,
      sentAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });
    return manager.save(NotificationOutboxEntity, event);
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    );
  }
}
