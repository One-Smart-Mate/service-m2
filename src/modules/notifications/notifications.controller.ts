import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdateAppRequestDTO } from './models/update.app.request.dto';
import { SendCustomNotificationDTO } from './models/send.custom.notification.dto';
import { PLATFORM_ADMIN_ROLE } from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@RequireRoles(PLATFORM_ADMIN_ROLE)
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
