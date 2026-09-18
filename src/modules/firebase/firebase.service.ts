import { Inject, Injectable } from '@nestjs/common';
import { Messaging } from 'firebase-admin/messaging';
import { NotificationDTO } from './models/firebase.request.dto';
import { stringConstants } from 'src/utils/string.constant';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class FirebaseService {
  constructor(
    @Inject('FIREBASE_MESSAGING') private readonly messaging: Messaging,
    private readonly logger: CustomLoggerService,
  ) {}

  sendNewMessage = async (
    notificationDTO: NotificationDTO,
    userToken: string,
  ) => {
    try {
      const message = {
        notification: {
          title: notificationDTO.notification_title,
          body: notificationDTO.notification_description,
        },
        data: {
          notification_title: notificationDTO.notification_title,
          notification_description: notificationDTO.notification_description,
          notification_type: notificationDTO.notification_type,
        },
        token: userToken,
      };
      this.logger.logFirebase('Sending single notification');
      await this.messaging.send(message);
      this.logger.logFirebase('Notification sent successfully');
      return Promise.resolve(true);
    } catch (error) {
      this.logger.logException('FirebaseService', 'sendNewMessage', error);
      return Promise.resolve(false);
    }
  };

  sendMultipleMessage = async (
    notificationDTO: NotificationDTO,
    registrationTokens: { token: string; type: string }[],
  ) => {
    try {
      this.logger.logFirebase(
        `Starting batch notification to ${registrationTokens.length} tokens`,
      );

      const results: { token: string; success: boolean; error?: any }[] = [];

      for (const [index, tokenObj] of registrationTokens.entries()) {
        let message;

        if (tokenObj.type === stringConstants.OS_ANDROID) {
          message = {
            data: {
              notification_title: notificationDTO.notification_title,
              notification_description:
                notificationDTO.notification_description,
              notification_type: notificationDTO.notification_type,
            },
            token: tokenObj.token,
          };
        } else if (
          tokenObj.type === stringConstants.OS_IOS ||
          tokenObj.type === stringConstants.OS_WEB
        ) {
          message = {
            notification: {
              title: notificationDTO.notification_title,
              body: notificationDTO.notification_description,
            },
            data: {
              notification_title: notificationDTO.notification_title,
              notification_description:
                notificationDTO.notification_description,
              notification_type: notificationDTO.notification_type,
            },
            token: tokenObj.token,
          };
        }

        try {
          const response = await this.messaging.send(message);
          this.logger.logFirebase(
            `Notification sent to recipient ${index + 1} (${tokenObj.type}) | MessageId: ${response}`,
          );
          results.push({ token: tokenObj.token, success: true });
        } catch (error) {
          this.logger.logFirebase(
            `Error sending to recipient ${index + 1} (${tokenObj.type}) - ${error.message}`,
          );
          results.push({ token: tokenObj.token, success: false, error });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      this.logger.logFirebase(
        `Batch completed. Successes: ${successCount} | Failures: ${failureCount}`,
      );

      return Promise.resolve(true);
    } catch (exception) {
      this.logger.logException(
        'FirebaseService',
        'sendMultipleMessage',
        exception,
      );
      return Promise.resolve(false);
    }
  };
}
