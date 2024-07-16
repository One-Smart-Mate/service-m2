import { Module } from '@nestjs/common';
import mailConfig from 'src/config/email.sender.config';
import { MailService } from './mail.service';

@Module({
  imports: [mailConfig],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
