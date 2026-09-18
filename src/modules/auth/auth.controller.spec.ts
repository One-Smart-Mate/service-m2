import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
});
