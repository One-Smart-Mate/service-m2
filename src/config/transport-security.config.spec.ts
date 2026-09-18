import {
  createDatabaseTlsOptions,
  createStrictTlsOptions,
} from './transport-security.config';

describe('transport security configuration', () => {
  it('validates database certificates by default', () => {
    expect(createDatabaseTlsOptions('DB', {})).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('normalizes an escaped private CA certificate', () => {
    expect(
      createDatabaseTlsOptions('DB_IA', {
        DB_IA_SSL_CA:
          '-----BEGIN CERTIFICATE-----\\nCA\\n-----END CERTIFICATE-----',
      }),
    ).toEqual({
      rejectUnauthorized: true,
      ca: '-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----',
    });
  });

  it('allows TLS to be disabled explicitly outside production', () => {
    expect(
      createDatabaseTlsOptions('DB', {
        DEPLOY_ENV: 'local',
        DB_SSL_ENABLED: 'false',
      }),
    ).toBeUndefined();
  });

  it('rejects disabling TLS in production', () => {
    expect(() =>
      createDatabaseTlsOptions('DB', {
        DEPLOY_ENV: 'production',
        DB_SSL_ENABLED: 'false',
      }),
    ).toThrow('DB_SSL_ENABLED cannot be disabled in production');
  });

  it('rejects ambiguous TLS flags', () => {
    expect(() =>
      createDatabaseTlsOptions('DB', { DB_SSL_ENABLED: 'sometimes' }),
    ).toThrow('DB_SSL_ENABLED must be true or false');
  });

  it('always rejects untrusted SMTP certificates', () => {
    expect(createStrictTlsOptions()).toEqual({ rejectUnauthorized: true });
  });
});
