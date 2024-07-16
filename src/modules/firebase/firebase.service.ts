import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: app.App) {}

  sendNewMessage = async (token: string): Promise<boolean> => {
    try {
      const message = {
        data: {
          hello: 'world',
        },
        token: token,
      };
      const messaging = this.firebaseApp.messaging();
      await messaging.send(message);
      return Promise.resolve(true);
    } catch (error) {
      console.log(error);
      return Promise.resolve(false);
    }
  };
}
