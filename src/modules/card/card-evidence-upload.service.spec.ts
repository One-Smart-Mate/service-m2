import { ConflictException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { CardEvidenceUploadService } from './card-evidence-upload.service';
import { assertEvidenceReceipts } from './card-evidence.policy';
import { CardEvidenceUploadEntity } from './entities/card-evidence-upload.entity';
import { CardEntity } from './entities/card.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CardEvidenceUploadType } from './models/dto/upload-card-evidence.dto';

describe('immutable evidence reservations', () => {
  const file = {
    buffer: Buffer.from('image'),
    mimetype: 'image/png',
    size: 5,
  } as Express.Multer.File;
  const hash = createHash('sha256').update(file.buffer).digest('hex');
  const key = 'site_7/cards/offline/images/IMCR_photo.png';
  const receipt = {
    siteId: 7,
    cardUUID: 'offline',
    evidenceId: 'photo',
    evidenceType: 'IMCR',
    ownerId: 1,
    objectKey: key,
    contentHash: hash,
    status: 'UPLOADED',
  };
  let manager: any;
  let storage: any;
  let service: CardEvidenceUploadService;
  beforeEach(() => {
    manager = {
      findOne: jest.fn((entity) =>
        Promise.resolve(entity === SiteEntity ? { id: 7 } : null),
      ),
      create: jest.fn((_entity, value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    storage = {
      buildKey: jest.fn(() => key),
      uploadCardEvidence: jest.fn().mockResolvedValue({ key, url: 'url' }),
    };
    const source = {
      transaction: (fn) => fn(manager),
      getRepository: () => ({
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
    service = new CardEvidenceUploadService(source as never, storage);
  });
  const upload = (service: CardEvidenceUploadService) =>
    service.upload(7, 'offline', 'photo', CardEvidenceUploadType.IMCR, file, 1);
  it('reserves an offline upload before calling storage', async () => {
    await upload(service);
    expect(manager.save).toHaveBeenCalledWith(
      CardEvidenceUploadEntity,
      expect.objectContaining({
        ownerId: 1,
        contentHash: hash,
        status: 'PENDING',
      }),
    );
    expect(manager.save.mock.invocationCallOrder[0]).toBeLessThan(
      storage.uploadCardEvidence.mock.invocationCallOrder[0],
    );
  });
  it.each([
    [{ ...receipt, ownerId: 2 }, ForbiddenException],
    [{ ...receipt, contentHash: 'different' }, ConflictException],
    [{ ...receipt, objectKey: 'different.png' }, ConflictException],
  ])(
    'rejects an altered receipt before storage',
    async (existing, exception) => {
      manager.findOne.mockImplementation((entity) =>
        Promise.resolve(
          entity === SiteEntity
            ? { id: 7 }
            : entity === CardEvidenceUploadEntity
              ? existing
              : null,
        ),
      );
      await expect(upload(service)).rejects.toBeInstanceOf(exception);
      expect(storage.uploadCardEvidence).not.toHaveBeenCalled();
    },
  );
  it.each(['R', 'C'])(
    'blocks new uploads to a card with status %s',
    async (status) => {
      manager.findOne.mockImplementation((entity) =>
        Promise.resolve(
          entity === SiteEntity
            ? { id: 7 }
            : entity === CardEntity
              ? { siteId: 7, status, creatorId: 1 }
              : null,
        ),
      );
      await expect(upload(service)).rejects.toThrow(ConflictException);
      expect(storage.uploadCardEvidence).not.toHaveBeenCalled();
    },
  );
  it('allows an identical completed receipt to be retried after closure', async () => {
    manager.findOne.mockImplementation((entity) =>
      Promise.resolve(
        entity === SiteEntity
          ? { id: 7 }
          : entity === CardEvidenceUploadEntity
            ? receipt
            : { siteId: 7, status: 'R' },
      ),
    );
    await expect(upload(service)).resolves.toBeDefined();
  });
  it('rejects another owner of the offline card draft', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: 7 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...receipt, ownerId: 2 });
    await expect(upload(service)).rejects.toThrow(ForbiddenException);
  });
  it('requires an uploaded receipt bound to the same site, card, owner and type', async () => {
    const url = `/card/evidence/7/content/${Buffer.from(key).toString('base64url')}`;
    manager.findOne.mockResolvedValue(receipt);
    await expect(
      assertEvidenceReceipts(manager, 7, 'offline', 1, [{ type: 'IMCR', url }]),
    ).resolves.toBeUndefined();
    manager.findOne.mockResolvedValue({ ...receipt, siteId: 8 });
    await expect(
      assertEvidenceReceipts(manager, 7, 'offline', 1, [{ type: 'IMCR', url }]),
    ).rejects.toThrow(ForbiddenException);
    manager.findOne.mockResolvedValue({ ...receipt, status: 'PENDING' });
    await expect(
      assertEvidenceReceipts(manager, 7, 'offline', 1, [{ type: 'IMCR', url }]),
    ).rejects.toThrow(ForbiddenException);
  });
  it('preserves a legacy service reference only for the correct card', async () => {
    const url = `/card/evidence/7/content/${Buffer.from(key).toString('base64url')}`;
    manager.findOne.mockResolvedValue(null);
    await expect(
      assertEvidenceReceipts(manager, 7, 'offline', 1, [{ type: 'IMCR', url }]),
    ).resolves.toBeUndefined();
    await expect(
      assertEvidenceReceipts(manager, 7, 'other-card', 1, [
        { type: 'IMCR', url },
      ]),
    ).rejects.toThrow(ForbiddenException);
  });
});
