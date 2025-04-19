import { Inject, Injectable, Logger } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { NotificationDTO } from './models/firebase.request.dto';
import { stringConstants } from 'src/utils/string.constant';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class FirebaseService {
  constructor(
    @Inject('FIREBASE_APP') private readonly firebaseApp: app.App,
    private readonly logger: CustomLoggerService
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
      this.logger.logFirebase(`Sending single notification to token: ${userToken}`);
      const messaging = this.firebaseApp.messaging();
      await messaging.send(message);
      this.logger.logFirebase(`Notification sent successfully to token: ${userToken}`);
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
      this.logger.logFirebase(`Starting batch notification to ${registrationTokens.length} tokens`);

      const messaging = this.firebaseApp.messaging();
      const results: { token: string; success: boolean; error?: any }[] = [];
  
      for (const tokenObj of registrationTokens) {
        let message;
       
        if (tokenObj.type === stringConstants.OS_ANDROID) {
          message = {
            data: {
              notification_title: notificationDTO.notification_title,
              notification_description: notificationDTO.notification_description,
              notification_type: notificationDTO.notification_type,
            },
            token: tokenObj.token,
          };
        } else if (tokenObj.type === stringConstants.OS_IOS || tokenObj.type === stringConstants.OS_WEB) {
          message = {
            notification: {
              title: notificationDTO.notification_title,
              body: notificationDTO.notification_description,
            },
            data: {
              notification_title: notificationDTO.notification_title,
              notification_description: notificationDTO.notification_description,
              notification_type: notificationDTO.notification_type,
            },
            token: tokenObj.token,
          };
        }
  
        try {
          const response = await messaging.send(message);
          this.logger.logFirebase(`✅ Notification sent to: ${tokenObj.token} (${tokenObj.type}) | MessageId: ${response}`);
          results.push({ token: tokenObj.token, success: true });
        } catch (error) {
          this.logger.logFirebase(`❌ Error sending to: ${tokenObj.token} (${tokenObj.type}) - ${error.message}`);
          results.push({ token: tokenObj.token, success: false, error });
        }
      }
  
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;
  
      this.logger.logFirebase(`Batch completed. Successes: ${successCount} | Failures: ${failureCount}`);
  
      return Promise.resolve(true);
    } catch (exception) {
      this.logger.logException('FirebaseService', 'sendMultipleMessage', exception);
      return Promise.resolve(false);
    }
  };
  
}
