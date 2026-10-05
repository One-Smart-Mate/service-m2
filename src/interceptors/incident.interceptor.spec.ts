import { CustomLoggerService } from '../common/logger/logger.service';
import { IncidentService } from '../modules/incident/incident.service';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';
import { IncidentInterceptor } from './incident.interceptor';

describe('IncidentInterceptor sensitive data', () => {
  it('persists a sanitized incident description', async () => {
    const incidentService = {
      create: jest.fn().mockResolvedValue(undefined),
    } as unknown as IncidentService;
    const logger = {
      logProcess: jest.fn(),
      logException: jest.fn(),
    } as unknown as CustomLoggerService;
    const interceptor = new IncidentInterceptor(
      incidentService,
      logger,
      {} as WhatsappService,
    );
    const request = {
      method: 'POST',
      url: '/auth/login?token=url-token',
      body: {
        email: 'victim@example.com',
        password: 'Secret123!',
        resetCode: 'ABC123',
      },
      query: { token: 'query-token' },
      params: {},
      headers: {
        authorization: 'Bearer jwt-value',
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'Android',
      },
      user: { id: 7, name: 'User', email: 'victim@example.com' },
      ip: '127.0.0.1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getClass: () => ({ name: 'AuthController' }),
      getHandler: () => ({ name: 'login' }),
    };

    await (interceptor as any).processIncident(
      new Error('Login failed for victim@example.com'),
      context,
    );

    const description = jest.mocked(incidentService.create).mock.calls[0][0]
      .description;
    expect(description).toContain('[REDACTED]');
    expect(description).not.toContain('victim@example.com');
    expect(description).not.toContain('Secret123!');
    expect(description).not.toContain('ABC123');
    expect(description).not.toContain('query-token');
    expect(description).not.toContain('url-token');
    expect(description).not.toContain('jwt-value');
  });
  it('never persists SQL, bound parameters or the raw error message', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const interceptor = new IncidentInterceptor(
      { create } as any,
      { logProcess: jest.fn(), logException: jest.fn() } as any,
      {} as any,
    );
    const error = Object.assign(
      new Error(
        'SELECT password FROM users WHERE password = raw-bound-credential',
      ),
      {
        name: 'QueryFailedError',
        query: 'SELECT secret FROM users',
        parameters: ['raw-bound-credential'],
        driverError: {
          code: 'ER_PARSE_ERROR',
          sqlMessage: 'raw-bound-credential',
        },
      },
    );
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/fixture',
          headers: {},
          body: {},
          query: {},
          params: {},
        }),
      }),
      getClass: () => ({ name: 'Fixture' }),
      getHandler: () => ({ name: 'fixture' }),
    };
    await (interceptor as any).processIncident(error, context);
    const description = create.mock.calls[0][0].description;
    expect(description).not.toContain('raw-bound-credential');
    expect(description).not.toContain('SELECT secret');
    expect(description).not.toContain('SELECT password');
  });
});
