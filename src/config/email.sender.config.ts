import {  MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

const mailConfig = (configService: ConfigService): MailerOptions => ({
  transport: {
    host: configService.get<string>('MAIL_HOST'),
    port: configService.get<number>('MAIL_PORT'),
    secure: false,
    requireTLS: true,
    auth: {
      user: configService.get<string>('MAIL_USERNAME'),
      pass: configService.get<string>('MAIL_PASSWORD'),
    },
    tls: {
      rejectUnauthorized: false,
    },
  },
  defaults: {
    from: configService.get<string>('MAIL_FROM_ADDRESS'),
  },
  template: {
    dir: join(__dirname, 'templates'),
    adapter: new HandlebarsAdapter(), 
    options: {
      strict: true,
    },
  },
});

export default mailConfig;
