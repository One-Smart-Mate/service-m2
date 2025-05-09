import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

const mailConfig = MailerModule.forRoot({
  transport: {
    host: process.env.EMAIL_HOST,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  defaults: {
    from: `"OSM" <${process.env.EMAIL_FROM}>`,
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
