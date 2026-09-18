export const REDACTED_LOG_VALUE = '[REDACTED]';

const SENSITIVE_KEYS = new Set([
  'apikey',
  'authorization',
  'code',
  'cookie',
  'email',
  'phonenumber',
  'resetcode',
  'setcookie',
]);

const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

const isSensitiveKey = (key: string) => {
  const normalizedKey = normalizeKey(key);

  return (
    SENSITIVE_KEYS.has(normalizedKey) ||
    normalizedKey.includes('password') ||
    normalizedKey.includes('secret') ||
    normalizedKey.endsWith('token')
  );
};

export const sanitizeTextForLogging = (value: unknown): string => {
  const text = String(value ?? '');

  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /([?&](?:access_?token|refresh_?token|token|password|fastPassword|resetCode|code)=)[^&\s]+/gi,
      '$1[REDACTED]',
    )
    .replace(
      /((?:access_?token|refresh_?token|token|password|fastPassword|resetCode|secret|apiKey)\s*["']?\s*[:=]\s*["']?)[^"',\s}\]]+/gi,
      '$1[REDACTED]',
    )
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
};

export const sanitizeForLogging = (
  value: unknown,
  seen = new WeakSet<object>(),
): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeTextForLogging(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return `[Buffer ${value.length} bytes]`;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogging(item, seen));
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (sanitized, [key, nestedValue]) => {
      sanitized[key] = isSensitiveKey(key)
        ? REDACTED_LOG_VALUE
        : sanitizeForLogging(nestedValue, seen);
      return sanitized;
    },
    {},
  );
};
