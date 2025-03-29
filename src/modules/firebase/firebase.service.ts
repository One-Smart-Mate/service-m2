import { Inject, Injectable } from '@nestjs/common';
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
        data: notificationDTO.toData(),
        token: userToken,
      };
      const messaging = this.firebaseApp.messaging();
      await messaging.send(message);
      return Promise.resolve(true);
    } catch (error) {
      console.log(error);
      return Promise.resolve(false);
    }
  };
  sendMultipleMessage = async (
    notificationDTO: NotificationDTO,
    registrationTokens: string[],
  ) => {
    try {
      console.log('[Firebase] Sending notifications 1x1 to tokens:', registrationTokens);
  
      const messaging = this.firebaseApp.messaging();
      const results: { token: string; success: boolean; error?: any }[] = [];
  
      for (const token of registrationTokens) {
        const message = {
          data: notificationDTO.toData(),
          token,
        };
  
        try {
          const response = await messaging.send(message);
          console.log(`[Firebase] ✅ Notification sent to: ${token} | MessageId: ${response}`);
          results.push({ token, success: true });
        } catch (error) {
          console.error(`[Firebase] ❌ Error sending to: ${token}`, {
            code: error.code,
            message: error.message,
          });
          results.push({ token, success: false, error });
        }
      }
  
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;
  
      console.log(`[Firebase] Sending completed. Successes: ${successCount} | Failures: ${failureCount}`);
  
      return Promise.resolve(true);
    } catch (exception) {
      console.error('[Firebase] General error when sending notifications:', exception);
      return Promise.resolve(false);
    }
  };
  
}
