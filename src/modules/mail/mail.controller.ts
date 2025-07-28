import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import { SendCardAssignmentDto } from './templates/entities/SendCardAssignmentDto ';
import { stringConstants } from 'src/utils/string.constant';

@ApiTags('Mail')
@ApiBearerAuth()
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly usersService: UsersService
  ) {}

  @Post('send-card-assignment')
  @ApiOperation({ summary: `${stringConstants.sendMailAssignamentSummary}` })
  @ApiBody({ type: SendCardAssignmentDto })
  @ApiResponse({ status: 201, description: `${stringConstants.sendMailAssignamentEmailSent}` })
  @ApiResponse({ status: 404, description: `${stringConstants.sendMailAssignamentUserNotFound}` })
  async sendCardAssignmentEmail(@Body() body: SendCardAssignmentDto) {
    const user = await this.usersService.findOneById(body.userId);
    if (!user) {
      throw new NotFoundException(`${stringConstants.sendMailAssignamentUserNotFound}`);
    }
    await this.mailService.sendCardAssignmentEmail(user, body.cardId, body.cardName, body.translation);
  }
}
