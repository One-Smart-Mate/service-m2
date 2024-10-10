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
      const message = {
        data: notificationDTO.toData(),
        tokens: registrationTokens,
      };
      const messaging = this.firebaseApp.messaging();
      await messaging.sendEachForMulticast(message);
      return Promise.resolve(true);
    } catch (exception) {
      return Promise.resolve(false);
    }
  };
}
