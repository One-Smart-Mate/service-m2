import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { emailTemplates } from './templates/email.templates';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendResetPasswordCode(user: UserEntity, resetCode: string, translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.emailTemplates[translation].resetPassword.subject,
        html: emailTemplates[translation].sendCodeMessage(user.name, resetCode, stringConstants.primaryColor),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async sendWelcomeEmail(user: UserEntity, appUrl: string, translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.emailTemplates[translation].welcome.subject,
        html: emailTemplates[translation].sendWelcomeMessage(user.name, appUrl, stringConstants.primaryColor),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async sendCardAssignmentEmail(
    user: Partial<UserEntity>, 
    cardId: number,
    cardName: string,
    translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES
  ) {
    try {
      const link = `${process.env.URL_WEB}/external/card/${cardId}/details?cardName=${encodeURIComponent(cardName)}`;
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.emailTemplates[translation].cardAssignment.subject,
        html: emailTemplates[translation].sendCardAssignmentMessage(user.name, cardName, link, stringConstants.primaryColor),
      });
    } catch (exception) { 
      HandleException.exception(exception);
    }
  }
}
