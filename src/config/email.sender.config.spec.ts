import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import mailConfig from './email.sender.config';

describe('email sender configuration', () => {
  it('loads the Handlebars adapter through the package public export', () => {
    const options = mailConfig(
      new ConfigService({
        MAIL_HOST: 'smtp.example.com',
        MAIL_PORT: 587,
        MAIL_USERNAME: 'mailer',
        MAIL_PASSWORD: 'secret',
        MAIL_FROM_ADDRESS: 'no-reply@example.com',
      }),
    );

    expect(options.template.adapter).toBeInstanceOf(HandlebarsAdapter);
  });
});
