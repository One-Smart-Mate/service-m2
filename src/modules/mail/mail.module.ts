import { Module, forwardRef } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from 'src/config/email.sender.config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { UsersModule } from '../users/users.module';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: mailConfig,
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [MailController],
  providers: [MailService, CustomLoggerService],
  exports: [MailService],
})
export class MailModule {}
