import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { SiteEntity } from '../site/entities/site.entity';
import { CardEntity } from './entities/card.entity';
import { CardEvidenceUploadEntity } from './entities/card-evidence-upload.entity';
import { CardEvidenceUploadType } from './models/dto/upload-card-evidence.dto';
import { R2CardEvidenceService } from './r2-card-evidence.service';

@Injectable()
export class CardEvidenceUploadService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly storage: R2CardEvidenceService,
  ) {}

  async upload(
    siteId: number,
    cardUUID: string,
    evidenceId: string,
    evidenceType: CardEvidenceUploadType,
    file: Express.Multer.File,
    ownerId: number,
  ) {
    if (!Number.isSafeInteger(ownerId) || ownerId <= 0)
      throw new UnauthorizedException();
    const objectKey = this.storage.buildKey(
      siteId,
      cardUUID,
      evidenceId,
      evidenceType,
      file.mimetype,
    );
    const contentHash = createHash('sha256').update(file.buffer).digest('hex');
    const alreadyUploaded = await this.dataSource.transaction(
      async (manager) => {
        const site = await manager.findOne(SiteEntity, {
          where: { id: siteId, status: 'A' },
          lock: { mode: 'pessimistic_write' },
        });
        if (!site) throw new ForbiddenException('Active site is required');
        const identity = { siteId, cardUUID, evidenceId, evidenceType };
        const existing = await manager.findOne(CardEvidenceUploadEntity, {
          where: identity,
        });
        if (existing) {
          if (Number(existing.ownerId) !== ownerId)
            throw new ForbiddenException('Evidence belongs to another user');
          if (
            existing.contentHash !== contentHash ||
            existing.objectKey !== objectKey
          )
            throw new ConflictException('Evidence is immutable');
          if (existing.status === 'UPLOADED') return true;
        }
        const card = await manager.findOne(CardEntity, {
          where: { cardUUID },
          lock: { mode: 'pessimistic_write' },
        });
        if (card) {
          if (Number(card.siteId) !== siteId)
            throw new ForbiddenException('Card belongs to another site');
          if (card.deletedAt || !['A', 'P', 'V'].includes(card.status))
            throw new ConflictException('Card is closed');
          const phase = evidenceType.slice(2);
          if (
            (phase === 'CR' && Number(card.creatorId) !== ownerId) ||
            (phase === 'PS' && card.userProvisionalSolutionId != null) ||
            (phase === 'CL' && card.userDefinitiveSolutionId != null)
          )
            throw new ConflictException('Evidence phase is closed');
        } else {
          const reservation = await manager.findOne(CardEvidenceUploadEntity, {
            where: { cardUUID },
          });
          if (
            reservation &&
            (Number(reservation.ownerId) !== ownerId ||
              Number(reservation.siteId) !== siteId)
          ) {
            throw new ForbiddenException(
              'Offline card belongs to another user or site',
            );
          }
        }
        if (!existing)
          await manager.save(
            CardEvidenceUploadEntity,
            manager.create(CardEvidenceUploadEntity, {
              ...identity,
              objectKey,
              ownerId,
              contentHash,
              contentType: file.mimetype,
              size: file.buffer.length,
              status: 'PENDING',
            }),
          );
        return false;
      },
    );
    if (alreadyUploaded)
      return {
        key: objectKey,
        url: `/card/evidence/${siteId}/content/${Buffer.from(objectKey).toString('base64url')}`,
        contentType: file.mimetype,
        size: file.buffer.length,
      };
    const uploaded = await this.storage.uploadCardEvidence(
      siteId,
      cardUUID,
      evidenceId,
      evidenceType,
      file,
    );
    await this.dataSource
      .getRepository(CardEvidenceUploadEntity)
      .update({ objectKey, ownerId, contentHash }, { status: 'UPLOADED' });
    return uploaded;
  }
}
