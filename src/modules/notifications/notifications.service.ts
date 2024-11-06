import { Injectable, Logger } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import { HandleException } from "src/common/exceptions/handler/handle.exception";
import { UsersService } from "../users/users.service";
import { NotificationDTO } from "../firebase/models/firebase.request.dto";
import { title } from "process";
import { UpdateAppRequestDTO } from "./models/update.app.request.dto";
import { stringConstants } from "src/utils/string.constant";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userService: UsersService,
  ) {} 
Ò


  appUpdateNotification = async (body: UpdateAppRequestDTO) => {
    try {
        Logger.log("Body ->", JSON.stringify(body));
        const users = await this.userService.findAllUsers();

        const firebaseData = new NotificationDTO(
          body.title, body.description, stringConstants.updateAppNotificationType
        );

        for await (const item of users) {
            const token = await this.userService.getUserToken(item.id);
            if (token != null && token != undefined && token != "") {
              await this.firebaseService.sendNewMessage(firebaseData, token);
            }
        }
    } catch (error) {
        HandleException.exception(error);
    }
  }
}