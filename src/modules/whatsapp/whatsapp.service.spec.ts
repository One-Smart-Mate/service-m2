import { BadGatewayException } from '@nestjs/common';
import axios from 'axios';
import { WhatsappService } from './whatsapp.service';

jest.mock('axios');
describe('WhatsApp provider error boundaries', () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  const service = new WhatsappService(
    { get: () => 'fixture' } as any,
    logger as any,
  );
  beforeEach(() => jest.resetAllMocks());
  it('does not forward a provider 401 as an application authentication failure', async () => {
    jest.mocked(axios.get).mockRejectedValueOnce({
      message: 'provider-secret-sentinel',
      response: {
        status: 401,
        data: { error: { message: 'provider-secret-sentinel' } },
      },
    });
    await expect(service.getMessageTemplates()).rejects.toMatchObject({
      status: 502,
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      'provider-secret-sentinel',
    );
  });
  it('uses the same safe error boundary for phone metadata', async () => {
    jest
      .mocked(axios.get)
      .mockRejectedValueOnce(new Error('provider-secret-sentinel'));
    await expect(service.getPhoneNumberInfo()).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      'provider-secret-sentinel',
    );
  });
  it('does not expose provider access tokens through paging URLs', async () => {
    jest.mocked(axios.get).mockResolvedValueOnce({
      data: {
        data: [],
        paging: {
          cursors: { after: 'cursor' },
          next: 'https://example.com?access_token=provider-secret-sentinel',
        },
      },
    });
    const result = await service.getMessageTemplates();
    expect(result.paging).toEqual({
      cursors: { after: 'cursor' },
      hasNext: true,
      hasPrevious: false,
    });
    expect(JSON.stringify(result)).not.toContain('provider-secret-sentinel');
  });
  it('preserves provider failure semantics when sending authentication messages', async () => {
    jest
      .mocked(axios.post)
      .mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      service.sendAuthenticationMessages([
        { phoneNumber: '521234567890', code: '123456', language: 'es' },
      ]),
    ).rejects.toMatchObject({ status: 502 });
  });
});
