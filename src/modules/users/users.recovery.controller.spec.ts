import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AUTH_THROTTLE } from 'src/common/auth/auth-throttle';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController password recovery', () => {
  let app: INestApplication;
  const usersService = {
    sendCodeToEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'default', ...AUTH_THROTTLE.default },
        ]),
      ],
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns a generic response and rate limits recovery-code requests', async () => {
    for (
      let attempt = 0;
      attempt < AUTH_THROTTLE.recoverySend.limit;
      attempt += 1
    ) {
      await request(app.getHttpServer())
        .post('/users/send-code')
        .send({ email: 'user@example.com' })
        .expect(201)
        .expect({
          message: 'If the account exists, a recovery code will be sent',
        });
    }

    await request(app.getHttpServer())
      .post('/users/send-code')
      .send({ email: 'user@example.com' })
      .expect(429);
  });
});
