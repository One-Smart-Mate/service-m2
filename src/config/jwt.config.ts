import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

const MINIMUM_JWT_SECRET_BYTES = 32;

export const createJwtOptions = (
  configService: ConfigService,
): JwtModuleOptions => {
  const secret = configService.get<string>('JWT_SECRET')?.trim();
  const expiresIn = configService.get<string>('JWT_EXPIRES_IN')?.trim();

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  if (Buffer.byteLength(secret, 'utf8') < MINIMUM_JWT_SECRET_BYTES) {
    throw new Error(
      `JWT_SECRET must contain at least ${MINIMUM_JWT_SECRET_BYTES} bytes`,
    );
  }

  if (!expiresIn) {
    throw new Error('JWT_EXPIRES_IN is required');
  }

  return {
    secret,
    signOptions: { expiresIn, algorithm: 'HS256' },
    verifyOptions: { algorithms: ['HS256'] },
  };
};
