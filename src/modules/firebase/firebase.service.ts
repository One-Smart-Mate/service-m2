import { Inject, Injectable, Logger } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { NotificationDTO } from './models/firebase.request.dto';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: app.App) {}

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
      const messaging = this.firebaseApp.messaging();
      await messaging.send(message);
      return Promise.resolve(true);
    } catch (error) {
      Logger.error("[FirebaseService-sendNewMessage] ", error);
      return Promise.resolve(false);
    }
  };
  sendMultipleMessage = async (
    notificationDTO: NotificationDTO,
    registrationTokens: { token: string; type: string }[],
  ) => {
    try {
      console.log('[Firebase] Sending notifications 1x1 to tokens:', registrationTokens);
      Logger.debug('[Firebase] Sending notifications 1x1 to tokens:', registrationTokens);

      const messaging = this.firebaseApp.messaging();
      const results: { token: string; success: boolean; error?: any }[] = [];
  
      for (const tokenObj of registrationTokens) {
        let message;
        
        // Configurar el mensaje según el tipo de dispositivo
        if (tokenObj.type === 'android') {
          message = {
            data: {
              notification_title: notificationDTO.notification_title,
              notification_description: notificationDTO.notification_description,
              notification_type: notificationDTO.notification_type,
            },
            token: tokenObj.token,
          };
        } else if (tokenObj.type === 'ios' || tokenObj.type === 'web') {
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
          console.log(`[Firebase] ✅ Notification sent to: ${tokenObj.token} (${tokenObj.type}) | MessageId: ${response}`);
          Logger.verbose(`[Firebase] ✅ Notification sent to: ${tokenObj.token} (${tokenObj.type}) | MessageId: ${response}`)
          results.push({ token: tokenObj.token, success: true });
        } catch (error) {
          console.error(`[Firebase] ❌ Error sending to: ${tokenObj.token} (${tokenObj.type})`, {
            code: error.code,
            message: error.message,
          });
          Logger.error(`[Firebase] ❌ Error sending to: ${tokenObj.token} (${tokenObj.type})`, {
            code: error.code,
            message: error.message,
          });
          results.push({ token: tokenObj.token, success: false, error });
        }
      }
  
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;
  
      console.log(`[Firebase] Sending completed. Successes: ${successCount} | Failures: ${failureCount}`);
  
      return Promise.resolve(true);
    } catch (exception) {
      Logger.error("[FirebaseService-sendNewMessage] ", exception);
      console.error('[Firebase] General error when sending notifications:', exception);
      return Promise.resolve(false);
    }
  };
  
}
