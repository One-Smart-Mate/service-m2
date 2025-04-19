import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { emailTemplates } from './templates/email.templates';
import { stringConstants } from 'src/utils/string.constant';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly logger: CustomLoggerService
  ) {}

  async sendResetPasswordCode(user: UserEntity, resetCode: string, translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES) {
    try {
      this.logger.logEmail('Sending password reset email', { email: user.email });
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.emailTemplates[translation].resetPassword.subject,
        html: emailTemplates[translation].sendCodeMessage(user.name, resetCode, stringConstants.primaryColor),
      });
    } catch (exception) {
      this.logger.logException('MailService', 'sendResetPasswordCode', exception);
      HandleException.exception(exception);
    }
  }

  async sendWelcomeEmail(user: UserEntity, appUrl: string, translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES) {
    try {
      this.logger.logEmail('Sending welcome email', { email: user.email });
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.emailTemplates[translation].welcome.subject,
        html: emailTemplates[translation].sendWelcomeMessage(user.name, appUrl, stringConstants.primaryColor),
      });
    } catch (exception) {
      this.logger.logException('MailService', 'sendWelcomeEmail', exception);
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
      this.logger.logEmail('Sending card assignment email', { email: user.email, cardId, cardName });
      const link = `${process.env.URL_WEB}/external/card/${cardId}/details?cardName=${encodeURIComponent(cardName)}`;
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.emailTemplates[translation].cardAssignment.subject,
        html: emailTemplates[translation].sendCardAssignmentMessage(user.name, cardName, link, stringConstants.primaryColor),
      });
    } catch (exception) { 
      this.logger.logException('MailService', 'sendCardAssignmentEmail', exception);
      HandleException.exception(exception);
    }
  }
}
