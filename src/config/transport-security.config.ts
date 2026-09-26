export type DatabaseTlsPrefix = 'DB' | 'DB_IA';

export interface StrictTlsOptions {
  rejectUnauthorized: true;
  ca?: string;
}

const TRUE_VALUES = new Set(['1', 'true', 'yes']);
const FALSE_VALUES = new Set(['0', 'false', 'no']);

const normalizeCertificate = (certificate?: string) => {
  const normalized = certificate?.replace(/\\n/g, '\n').trim();
  return normalized || undefined;
};

const parseEnabledFlag = (name: string, value?: string) => {
  if (value === undefined || value.trim() === '') {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(`${name} must be true or false`);
};

export const createStrictTlsOptions = (
  certificate?: string,
): StrictTlsOptions => {
  const ca = normalizeCertificate(certificate);
  return {
    rejectUnauthorized: true,
    ...(ca ? { ca } : {}),
  };
};

export const createDatabaseTlsOptions = (
  prefix: DatabaseTlsPrefix,
  environment: NodeJS.ProcessEnv = process.env,
): StrictTlsOptions | undefined => {
  const enabledName = `${prefix}_SSL_ENABLED`;
  const enabled = parseEnabledFlag(enabledName, environment[enabledName]);

  if (!enabled) {
    return undefined;
  }

  return createStrictTlsOptions(environment[`${prefix}_SSL_CA`]);
};
