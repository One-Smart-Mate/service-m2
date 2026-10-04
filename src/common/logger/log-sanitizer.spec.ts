import { Logger } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';
import {
  REDACTED_LOG_VALUE,
  sanitizeForLogging,
  sanitizeTextForLogging,
} from './log-sanitizer';

describe('log sanitization', () => {
  it('redacts nested credentials and personal contact data', () => {
    const input = {
      email: 'user@example.com',
      password: 'Password123!',
      siteCode: 'SITE-01',
      authMessages: [
        {
          phoneNumber: '521234567890',
          code: 'AB1234',
        },
      ],
      session: {
        access_token: 'jwt-value',
      },
    };

    expect(sanitizeForLogging(input)).toEqual({
      email: REDACTED_LOG_VALUE,
      password: REDACTED_LOG_VALUE,
      siteCode: 'SITE-01',
      authMessages: [
        {
          phoneNumber: REDACTED_LOG_VALUE,
          code: REDACTED_LOG_VALUE,
        },
      ],
      session: {
        access_token: REDACTED_LOG_VALUE,
      },
    });
  });

  it('redacts credentials embedded in free text', () => {
    const sanitized = sanitizeTextForLogging(
      'Bearer abc.def.ghi email=user@example.com password=Secret123 token=push-token',
    );

    expect(sanitized).not.toContain('abc.def.ghi');
    expect(sanitized).not.toContain('user@example.com');
    expect(sanitized).not.toContain('Secret123');
    expect(sanitized).not.toContain('push-token');
  });

  it('sanitizes request bodies before writing them to the logger', () => {
    const logger = new CustomLoggerService();
    const logSpy = jest.spyOn(logger, 'log').mockImplementation();

    logger.logRequest('/auth/login', {
      email: 'user@example.com',
      password: 'Secret123',
    });

    const output = String(logSpy.mock.calls[0][0]);
    expect(output).toContain(REDACTED_LOG_VALUE);
    expect(output).not.toContain('user@example.com');
    expect(output).not.toContain('Secret123');
  });

  it('sanitizes direct logger calls used by integrations', () => {
    const baseLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const logger = new CustomLoggerService();

    logger.log('password=Secret123 user@example.com', {
      accessToken: 'jwt-value',
    });

    const output = JSON.stringify(baseLogSpy.mock.calls);
    expect(output).not.toContain('Secret123');
    expect(output).not.toContain('user@example.com');
    expect(output).not.toContain('jwt-value');
    baseLogSpy.mockRestore();
  });
});
