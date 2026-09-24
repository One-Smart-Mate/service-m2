import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { UsersService } from '../users/users.service';
import {
  NotificationAudience,
  NotificationOutboxEntity,
  NotificationOutboxStatus,
} from './entities/notification-outbox.entity';

interface DeviceToken {
  token: string;
  type: string;
}

@Injectable()
export class NotificationOutboxProcessor {
  private static readonly BATCH_SIZE = 20;
  private static readonly MAX_ATTEMPTS = 8;
  private static readonly STALE_LOCK_MILLISECONDS = 5 * 60 * 1000;
  private readonly logger = new Logger(NotificationOutboxProcessor.name);
  private processing = false;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Interval(5_000)
  async processPending(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      for (let index = 0; index < NotificationOutboxProcessor.BATCH_SIZE; index++) {
        const event = await this.claimNext();
        if (!event) {
          return;
        }
        await this.processEvent(event);
      }
    } finally {
      this.processing = false;
    }
  }

  private claimNext(): Promise<NotificationOutboxEntity | null> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const staleBefore = new Date(
        now.getTime() -
          NotificationOutboxProcessor.STALE_LOCK_MILLISECONDS,
      );
      const event = await manager
        .createQueryBuilder(NotificationOutboxEntity, 'outbox')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where(
          `(
            outbox.status IN (:...readyStatuses)
            AND outbox.availableAt <= :now
          ) OR (
            outbox.status = :processingStatus
            AND outbox.lockedAt <= :staleBefore
          )`,
          {
            readyStatuses: [
              NotificationOutboxStatus.PENDING,
              NotificationOutboxStatus.FAILED,
            ],
            processingStatus: NotificationOutboxStatus.PROCESSING,
            now,
            staleBefore,
          },
        )
        .orderBy('outbox.id', 'ASC')
        .getOne();

      if (!event) {
        return null;
      }

      event.status = NotificationOutboxStatus.PROCESSING;
      event.lockedAt = now;
      event.attempts += 1;
      event.updatedAt = now;
      return manager.save(NotificationOutboxEntity, event);
    });
  }

  private async processEvent(event: NotificationOutboxEntity): Promise<void> {
    try {
      const tokens = await this.resolveTokens(event.payload.audience);
      if (tokens.length > 0) {
        const notification = new NotificationDTO(
          event.payload.notification.title,
          event.payload.notification.description,
          event.payload.notification.type,
          String(event.id),
        );
        const delivered = await this.firebaseService.sendMultipleMessage(
          notification,
          tokens,
        );
        if (!delivered) {
          throw new Error('Firebase rejected one or more recipients');
        }
      }
      await this.markSent(event.id);
    } catch {
      await this.markFailed(event);
      this.logger.warn(
        `Notification outbox event ${event.id} failed on attempt ${event.attempts}`,
      );
    }
  }

  private async resolveTokens(
    audience: NotificationAudience,
  ): Promise<DeviceToken[]> {
    let tokens: DeviceToken[];
    switch (audience.type) {
      case 'user':
        tokens = await this.usersService.getUserToken(audience.userId);
        break;
      case 'users': {
        const tokenGroups = await Promise.all(
          audience.userIds.map((userId) =>
            this.usersService.getUserToken(userId),
          ),
        );
        tokens = tokenGroups.flat();
        break;
      }
      case 'site':
        tokens = await this.usersService.getSiteUsersTokens(
          audience.siteId,
          audience.excludeWeb,
        );
        break;
      case 'site-except-user':
        tokens =
          await this.usersService.getSiteUsersTokensExcludingOwnerUser(
            audience.siteId,
            audience.excludedUserId,
          );
        break;
      case 'all-users': {
        const users = await this.usersService.findAllUsers();
        const tokenGroups = await Promise.all(
          users.map((user) => this.usersService.getUserToken(user.id)),
        );
        tokens = tokenGroups.flat();
        break;
      }
    }

    return [
      ...new Map(tokens.map((token) => [token.token, token])).values(),
    ];
  }

  private markSent(id: number): Promise<unknown> {
    const now = new Date();
    return this.dataSource.getRepository(NotificationOutboxEntity).update(
      { id, status: NotificationOutboxStatus.PROCESSING },
      {
        status: NotificationOutboxStatus.SENT,
        sentAt: now,
        lockedAt: null,
        lastError: null,
        updatedAt: now,
      },
    );
  }

  private markFailed(event: NotificationOutboxEntity): Promise<unknown> {
    const now = new Date();
    const exhausted =
      event.attempts >= NotificationOutboxProcessor.MAX_ATTEMPTS;
    const delaySeconds = Math.min(2 ** event.attempts * 5, 3_600);
    return this.dataSource.getRepository(NotificationOutboxEntity).update(
      { id: event.id, status: NotificationOutboxStatus.PROCESSING },
      {
        status: exhausted
          ? NotificationOutboxStatus.DEAD
          : NotificationOutboxStatus.FAILED,
        availableAt: new Date(now.getTime() + delaySeconds * 1000),
        lockedAt: null,
        lastError: 'Notification dispatch failed',
        updatedAt: now,
      },
    );
  }
}
