import { shouldSynchronizeDatabase } from './database-synchronize.config';

describe('database synchronize configuration', () => {
  it('is disabled by default', () => {
    expect(shouldSynchronizeDatabase({})).toBe(false);
  });

  it('can be enabled explicitly in dev deployments', () => {
    expect(
      shouldSynchronizeDatabase({
        DEPLOY_ENV: 'dev',
        NODE_ENV: 'production',
        DB_SYNCHRONIZE: 'true',
      }),
    ).toBe(true);
  });

  it('remains disabled when the flag is false', () => {
    expect(
      shouldSynchronizeDatabase({
        DEPLOY_ENV: 'dev',
        DB_SYNCHRONIZE: 'false',
      }),
    ).toBe(false);
  });

  it('rejects synchronize in production', () => {
    expect(() =>
      shouldSynchronizeDatabase({
        DEPLOY_ENV: 'production',
        DB_SYNCHRONIZE: 'true',
      }),
    ).toThrow(
      'DB_SYNCHRONIZE can only be enabled in dev, development, local or test',
    );
  });

  it('rejects ambiguous values', () => {
    expect(() =>
      shouldSynchronizeDatabase({
        DEPLOY_ENV: 'dev',
        DB_SYNCHRONIZE: 'sometimes',
      }),
    ).toThrow('DB_SYNCHRONIZE must be true or false');
  });
});
