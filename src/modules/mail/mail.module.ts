import { Module, forwardRef } from '@nestjs/common';
import mailConfig from 'src/config/email.sender.config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [
    mailConfig,
    forwardRef(() => UsersModule),
  ],
  controllers: [MailController], 
  providers: [MailService],
  exports: [MailService], 
})
export class MailModule {}
