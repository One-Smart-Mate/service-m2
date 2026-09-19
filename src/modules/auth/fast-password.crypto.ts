import { createHmac } from 'crypto';

const MINIMUM_PEPPER_BYTES = 32;

export const getFastPasswordPepper = (
  environment: NodeJS.ProcessEnv = process.env,
): string => {
  const pepper = environment.FAST_PASSWORD_PEPPER?.trim();
  if (!pepper) {
    throw new Error('FAST_PASSWORD_PEPPER is required');
  }
  if (Buffer.byteLength(pepper, 'utf8') < MINIMUM_PEPPER_BYTES) {
    throw new Error(
      `FAST_PASSWORD_PEPPER must contain at least ${MINIMUM_PEPPER_BYTES} bytes`,
    );
  }
  return pepper;
};

export const digestFastPassword = (
  fastPassword: string,
  pepper = getFastPasswordPepper(),
): string =>
  createHmac('sha256', pepper)
    .update(fastPassword.trim().toUpperCase(), 'utf8')
    .digest('hex');
