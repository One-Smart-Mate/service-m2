import { Body, Controller, Logger, Param, Post } from "@nestjs/common";
import { ApiParam, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { UpdateAppRequestDTO } from "./models/update.app.request.dto";


@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {} 


  @Post('/update-app')
  appUpdateNotification(@Body() body: UpdateAppRequestDTO) {
    return this.service.appUpdateNotification(body);
  }
}