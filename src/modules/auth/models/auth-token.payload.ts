export const PRIMARY_SESSION = 'primary';
export const FAST_SESSION = 'fast';
export const FAST_SESSION_EXPIRES_IN = '15m';
export const FAST_SESSION_TTL_MS = 15 * 60 * 1000;

export interface AuthTokenPayload {
  id: number;
  name: string;
  email: string;
  platform: string;
  timezone?: string;
  sessionType: typeof PRIMARY_SESSION | typeof FAST_SESSION;
  jti: string;
  actorId?: number;
}
