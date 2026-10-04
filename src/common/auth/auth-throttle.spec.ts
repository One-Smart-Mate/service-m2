import { Request } from 'express';
import { getAuthThrottleTracker } from './auth-throttle';

describe('authentication throttle tracker', () => {
  it('scopes public attempts by IP and normalized account identity', () => {
    const request = {
      ip: '192.0.2.10',
      body: { email: ' User@Example.com ' },
    } as Request;

    expect(getAuthThrottleTracker(request)).toBe(
      '192.0.2.10:user@example.com',
    );
  });

  it('uses the effective authenticated user for fast-password attempts', () => {
    const request = {
      ip: '192.0.2.10',
      body: { fastPassword: 'AB12' },
      user: { id: 7 },
    } as unknown as Request;

    expect(getAuthThrottleTracker(request)).toBe('192.0.2.10:7');
  });
});
