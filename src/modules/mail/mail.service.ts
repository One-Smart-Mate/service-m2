import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { sendCodeMessage } from './templates/email.templates';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendResetPasswordCode(user: UserEntity, code: string) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset Your Password - M2',
        html: sendCodeMessage(user.name, code),
      });
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  }
}
