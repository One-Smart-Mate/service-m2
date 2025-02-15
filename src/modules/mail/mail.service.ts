import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { sendCodeMessage, sendWelcomeMessage, sendCardAssignmentMessage } from './templates/email.templates';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class MailService {
  cardRepository: any;
  constructor(private mailerService: MailerService) {}

  async sendResetPasswordCode(user: UserEntity, code: string) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.resetPasswordEmailSubject,
        html: sendCodeMessage(user.name, code, stringConstants.primaryColor),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async sendWelcomeEmail(user: UserEntity, appUrl: string) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.welcomeEmailSubject,
        html: sendWelcomeMessage(user.name, appUrl, stringConstants.primaryColor),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async sendCardAssignmentEmail(
    user: Partial<UserEntity>, 
    cardId: number,
    cardName: string
  ) {
    try {
      const link = `${process.env.APP_WEB_URL}/external/card/${cardId}/details?cardName=${encodeURIComponent(cardName)}`;
      await this.mailerService.sendMail({
        to: user.email,
        subject: `${stringConstants.asignationCard} ${cardName}`,
        html: sendCardAssignmentMessage(user.name, cardName, link),
      });
  
    } catch (exception) { 
      HandleException.exception(exception);
    }
  }
}
