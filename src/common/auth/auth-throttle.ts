import { Request } from 'express';

export const AUTH_THROTTLE = {
  default: { limit: 30, ttl: 60_000, blockDuration: 60_000 },
  login: { limit: 5, ttl: 60_000, blockDuration: 5 * 60_000 },
  fastLogin: { limit: 5, ttl: 60_000, blockDuration: 5 * 60_000 },
  recoverySend: {
    limit: 3,
    ttl: 10 * 60_000,
    blockDuration: 30 * 60_000,
  },
  recoveryVerify: {
    limit: 5,
    ttl: 10 * 60_000,
    blockDuration: 30 * 60_000,
  },
  recoveryReset: {
    limit: 5,
    ttl: 10 * 60_000,
    blockDuration: 30 * 60_000,
  },
} as const;

export const getAuthThrottleTracker = (request: Request): string => {
  const ipAddress = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  const body = request.body ?? {};
  const identity =
    request['user']?.id ?? body.email ?? body.phoneNumber ?? 'anonymous';

  return `${ipAddress}:${String(identity).trim().toLowerCase()}`;
};
