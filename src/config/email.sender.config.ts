import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

const mailConfig = MailerModule.forRoot({
  
  
  transport: {
    host: 'cdentalcaregroup.com',
    secure: false,
    auth: {
      user: 'cdentalcaregorup-contact@cdentalcaregroup.com',
      pass: '96BTJhHB9NV#$#12',
    },
  },
  defaults: {
    from: '"M2" <cdentalcaregorup-contact@cdentalcaregroup.com>',
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
