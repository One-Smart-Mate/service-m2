import { ConfigService } from '@nestjs/config';
import { createJwtOptions } from './jwt.config';

describe('JWT configuration', () => {
  it('uses the configured secret and expiration', () => {
    const config = new ConfigService({
      JWT_SECRET: 'a-secure-secret-with-at-least-32-bytes',
      JWT_EXPIRES_IN: '1h',
    });

    expect(createJwtOptions(config)).toEqual({
      secret: 'a-secure-secret-with-at-least-32-bytes',
      signOptions: { expiresIn: '1h', algorithm: 'HS256' },
      verifyOptions: { algorithms: ['HS256'] },
    });
  });

  it.each([
    [{ JWT_EXPIRES_IN: '1h' }, 'JWT_SECRET is required'],
    [
      { JWT_SECRET: 'short', JWT_EXPIRES_IN: '1h' },
      'JWT_SECRET must contain at least 32 bytes',
    ],
    [
      { JWT_SECRET: 'a-secure-secret-with-at-least-32-bytes' },
      'JWT_EXPIRES_IN is required',
    ],
  ])('fails fast for an unsafe configuration', (values, expectedMessage) => {
    expect(() => createJwtOptions(new ConfigService(values))).toThrow(
      expectedMessage,
    );
  });
});
