const fs = require('node:fs');
const keys = [
  'DB_HOST',
  'DB_HOST_IA',
  'DB_NAME',
  'DB_NAME_IA',
  'DB_PASSWORD',
  'DB_PASSWORD_IA',
  'DB_PORT',
  'DB_PORT_IA',
  'DB_USERNAME',
  'DB_USERNAME_IA',
  'FIREBASE_AUTH_PROVIDER',
  'FIREBASE_AUTH_URI',
  'FIREBASE_CLIENT',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_TOKEN_URI',
  'FIREBASE_UNIVERSE_DOMAIN',
  'GEMINI_API_KEY',
  'MAIL_MAILER',
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_USERNAME',
  'MAIL_PASSWORD',
  'MAIL_ENCRYPTION',
  'MAIL_FROM_ADDRESS',
  'MAIL_FROM_NAME',
  'URL_WEB',
  'JWT_EXPIRES_IN',
  'JWT_SECRET',
  'USER_ONE',
  'USER_TWO',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_WABA_ID',
  'CLOUDFLARE_R2_ACCESS_KEY',
  'CLOUDFLARE_R2_SECRET_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL',
  'CLOUDFLARE_R2_ENDPOINT',
  'DB_SSL_ENABLED',
  'DB_SSL_CA',
  'DB_IA_SSL_ENABLED',
  'DB_IA_SSL_CA',
];
const required = [
  'LIGHTSAIL_SERVICE_NAME',
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'DB_USERNAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLOUDFLARE_R2_ACCESS_KEY',
  'CLOUDFLARE_R2_SECRET_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL',
  'CLOUDFLARE_R2_ENDPOINT',
];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length)
  throw new Error(`Missing deployment configuration: ${missing.join(', ')}`);
if (
  !/^\d+$/.test(process.env.DB_PORT) ||
  Number(process.env.DB_PORT) < 1 ||
  Number(process.env.DB_PORT) > 65535
)
  throw new Error('Invalid DB_PORT');
if (process.argv.includes('--verify')) process.exit(0);
if (!process.env.IMAGE_URI) throw new Error('Missing IMAGE_URI');
const environment = Object.fromEntries(
  keys.filter((key) => process.env[key]).map((key) => [key, process.env[key]]),
);
Object.assign(environment, {
  DEPLOY_ENV: process.env.DEPLOY_ENV,
  APP_VERSION: process.env.APP_VERSION,
  NODE_ENV: 'production',
  DB_SYNCHRONIZE: 'false',
});
fs.writeFileSync(
  'containers.json',
  JSON.stringify({
    [process.env.LIGHTSAIL_SERVICE_NAME]: {
      image: process.env.IMAGE_URI,
      ports: { 3000: 'HTTP' },
      environment,
    },
  }),
  { mode: 0o600 },
);
fs.writeFileSync(
  'public.json',
  JSON.stringify({
    containerName: process.env.LIGHTSAIL_SERVICE_NAME,
    containerPort: 3000,
    healthCheck: {
      path: '/health/ready',
      successCodes: '200',
      healthyThreshold: 2,
      unhealthyThreshold: 2,
      timeoutSeconds: 5,
      intervalSeconds: 10,
    },
  }),
  { mode: 0o600 },
);
