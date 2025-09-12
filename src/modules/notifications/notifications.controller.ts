import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdateAppRequestDTO } from './models/update.app.request.dto';
import { SendCustomNotificationDTO } from './models/send.custom.notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  private readonly logger = new Logger(NotificationsController.name);

  @Post('/update-app')
  appUpdateNotification(@Body() body: UpdateAppRequestDTO) {
    return this.service.appUpdateNotification(body);
  }

  @Post('/send-custom-notification')
  sendCustomNotification(@Body() body: SendCustomNotificationDTO) {
    return this.service.sendCustomNotification(body);
  }
}
