import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

const mailConfig = MailerModule.forRoot({
  transport: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  },
  defaults: {
    from: `"OSM" <${process.env.MAIL_FROM}>`,
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
