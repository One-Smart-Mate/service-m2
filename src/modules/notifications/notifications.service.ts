import { Injectable } from '@nestjs/common';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { UpdateAppRequestDTO } from './models/update.app.request.dto';
import { stringConstants } from 'src/utils/string.constant';
import { SendCustomNotificationDTO } from './models/send.custom.notification.dto';
import { NotificationOutboxService } from './notification-outbox.service';
import { randomUUID } from 'crypto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly outboxService: NotificationOutboxService,
  ) {}

  appUpdateNotification = async (body: UpdateAppRequestDTO) => {
    try {
      const event = await this.outboxService.enqueue({
        deduplicationKey: `app-update:${body.appVersion}`,
        payload: {
          audience: { type: 'all-users' },
          notification: {
            title: body.title,
            description: body.description,
            type: stringConstants.updateAppNotificationType,
          },
        },
      });
      return { queued: true, eventId: event.id };
    } catch (error) {
      HandleException.exception(error);
    }
  };

  sendCustomNotification = async (body: SendCustomNotificationDTO) => {
    try {
      const event = await this.outboxService.enqueue({
        deduplicationKey: `custom:${randomUUID()}`,
        payload: {
          audience: { type: 'users', userIds: body.userIds },
          notification: {
            title: body.title,
            description: body.description,
            type: stringConstants.customNotificationType,
          },
        },
      });
      return { queued: true, eventId: event.id };
    } catch (error) {
      HandleException.exception(error);
    }
  };
}
