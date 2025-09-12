import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { UsersService } from '../users/users.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { UpdateAppRequestDTO } from './models/update.app.request.dto';
import { stringConstants } from 'src/utils/string.constant';
import { SendCustomNotificationDTO } from './models/send.custom.notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userService: UsersService,
  ) {}

  appUpdateNotification = async (body: UpdateAppRequestDTO) => {
    try {
      Logger.log('Body ->', JSON.stringify(body));
      const users = await this.userService.findAllUsers();

      const firebaseData = new NotificationDTO(
        body.title,
        body.description,
        stringConstants.updateAppNotificationType,
      );

      for await (const item of users) {
        const tokens = await this.userService.getUserToken(item.id);
        if (tokens && tokens.length > 0) {
          await this.firebaseService.sendMultipleMessage(firebaseData, tokens);
        }
      }
    } catch (error) {
      HandleException.exception(error);
    }
  };

  sendCustomNotification = async (body: SendCustomNotificationDTO) => {
    try {
      Logger.log(JSON.stringify(body));
  
      const tokensArrays = await Promise.all(
        body.userIds.map((userId) => this.userService.getUserToken(userId)),
      );
  
      const validTokens = tokensArrays.flat().filter((tokenObj) => tokenObj && tokenObj.token);
  
      if (!validTokens.length) {
        Logger.warn(stringConstants.noValidTokensFound);
        return {
          message: stringConstants.noValidUsersForNotification,
        };
      }
  
      const firebaseData = new NotificationDTO(
        body.title,
        body.description,
        stringConstants.customNotificationType,
      );

      await this.firebaseService.sendMultipleMessage(firebaseData, validTokens);
      
      Logger.log(stringConstants.notificationSentSuccessfully);
      return { message: stringConstants.notificationSentSuccessfully };
    } catch (error) {
      Logger.error(stringConstants.errorSendingNotification, error);
      HandleException.exception(error);
    }
  };
}
