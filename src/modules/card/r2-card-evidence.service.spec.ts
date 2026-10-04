import { ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { R2CardEvidenceService } from './r2-card-evidence.service';
import { CardEvidenceUploadType } from './models/dto/upload-card-evidence.dto';

describe('R2 conditional writes', () => {
  const file = {
    buffer: Buffer.from('image'),
    mimetype: 'image/png',
    size: 5,
  } as Express.Multer.File;
  let service: R2CardEvidenceService;
  let send: jest.Mock;
  beforeEach(() => {
    service = new R2CardEvidenceService({
      get: (key: string) =>
        key.includes('ENDPOINT') || key.includes('URL')
          ? 'https://storage.example.com'
          : 'fixture',
    } as never);
    send = jest.fn().mockResolvedValue({});
    (service as any).client.send = send;
  });
  const upload = (service: R2CardEvidenceService) =>
    service.uploadCardEvidence(
      7,
      'card',
      'photo',
      CardEvidenceUploadType.IMCR,
      file,
    );
  it('uses If-None-Match and a content fingerprint to prevent overwrites', async () => {
    await upload(service);
    expect(send.mock.calls[0][0].input).toMatchObject({
      IfNoneMatch: '*',
      Metadata: {
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
      },
    });
  });
  it('accepts a replay only when the existing object matches exactly', async () => {
    send
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 412 } })
      .mockResolvedValueOnce({
        Metadata: {
          sha256: createHash('sha256').update(file.buffer).digest('hex'),
        },
        ContentType: 'image/png',
        ContentLength: 5,
      });
    await expect(upload(service)).resolves.toMatchObject({ size: 5 });
    expect(send).toHaveBeenCalledTimes(2);
  });
  it('preserves older objects and rejects mismatched replacements', async () => {
    send
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 412 } })
      .mockResolvedValueOnce({ ContentType: 'image/png', ContentLength: 5 });
    await expect(upload(service)).rejects.toThrow(ConflictException);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
