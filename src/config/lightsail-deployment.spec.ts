import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

describe('Lightsail deployment configuration', () => {
  const script = resolve('scripts/lightsail-deployment.cjs');
  let directory: string;
  const environment = {
    LIGHTSAIL_SERVICE_NAME: 'fixture',
    DB_HOST: 'localhost',
    DB_NAME: 'fixture',
    DB_PASSWORD: 'fake',
    DB_PORT: '3306',
    DB_USERNAME: 'fixture',
    JWT_SECRET: 'fixture-jwt-secret-with-at-least-32-bytes',
    FAST_PASSWORD_PEPPER: 'fixture-fast-password-pepper-with-32-bytes',
    JWT_EXPIRES_IN: '1h',
    CLOUDFLARE_R2_ACCESS_KEY: 'fake',
    CLOUDFLARE_R2_SECRET_KEY: 'fake',
    CLOUDFLARE_R2_BUCKET_NAME: 'fixture',
    CLOUDFLARE_R2_PUBLIC_URL: 'https://example.com',
    CLOUDFLARE_R2_ENDPOINT: 'https://example.com',
    DEPLOY_ENV: 'develop',
    APP_VERSION: 'fixture',
    IMAGE_URI: ':fixture.1',
  };
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'osm-deployment-'));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  it('preserves quotes and actual newlines without putting secrets in shell source', () => {
    const secret = 'fixture "quoted" key\nsecond line\n$(literal)';
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      env: { ...environment, FIREBASE_PRIVATE_KEY: secret },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const container = JSON.parse(
      readFileSync(join(directory, 'containers.json'), 'utf8'),
    );
    expect(container.fixture.environment.FIREBASE_PRIVATE_KEY).toBe(secret);
    expect(container.fixture.environment.FAST_PASSWORD_PEPPER).toBe(
      environment.FAST_PASSWORD_PEPPER,
    );
    const endpoint = JSON.parse(
      readFileSync(join(directory, 'public.json'), 'utf8'),
    );
    expect(endpoint.healthCheck.path).toBe('/health/ready');
  });
  it('blocks a deployment missing required R2 configuration', () => {
    const result = spawnSync(process.execPath, [script, '--verify'], {
      cwd: directory,
      env: { ...environment, CLOUDFLARE_R2_ACCESS_KEY: '' },
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('CLOUDFLARE_R2_ACCESS_KEY');
  });
  it.each(['JWT_SECRET', 'FAST_PASSWORD_PEPPER'])(
    'blocks missing or short %s before creating a deployment',
    (key) => {
      for (const value of ['', 'short']) {
        const result = spawnSync(process.execPath, [script, '--verify'], {
          cwd: directory,
          env: { ...environment, [key]: value },
          encoding: 'utf8',
        });
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(key);
      }
    },
  );
});
