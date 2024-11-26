import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { sendCodeMessage, sendWelcomeMessage } from './templates/email.templates';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendResetPasswordCode(user: UserEntity, code: string) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.resetPasswordEmailSubject,
        html: sendCodeMessage(user.name, code),
      });
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  }

  async sendWelcomeEmail(user: UserEntity, appUrl: string) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: stringConstants.welcomeEmailSubject,
        html: sendWelcomeMessage(user.name, appUrl),
      });
    } catch (exception) {
      console.error('Failed to send welcome email:', exception);
      HandleException.exception(exception);
    }
  }
}
