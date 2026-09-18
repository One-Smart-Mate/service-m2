import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { AUTH_THROTTLE } from 'src/common/auth/auth-throttle';

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'default', ...AUTH_THROTTLE.default },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            loginWithFastPassword: jest.fn(),
            updateLastLogin: jest.fn(),
            refreshToken: jest.fn(),
            sendFastPasswordByPhone: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('does not expose the insecure reset-password endpoint', async () => {
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        email: 'victim@example.com',
        newPassword: 'new-password',
      })
      .expect(404);
  });

  it('rate limits repeated login attempts for the same account and IP', async () => {
    for (let attempt = 0; attempt < AUTH_THROTTLE.login.limit; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          platform: 'WEB',
        })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
        platform: 'WEB',
      })
      .expect(429);
  });
});
