import { ForbiddenException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CardEvidenceUploadEntity } from './entities/card-evidence-upload.entity';

/** Validate new receipts and keep legacy references bound to their original card. */
export async function assertEvidenceReceipts(
  manager: EntityManager,
  siteId: number,
  cardUUID: string,
  ownerId: number,
  evidences: Array<{ type: string; url: string }>,
): Promise<void> {
  for (const evidence of evidences) {
    if (!evidence.url.includes('/card/evidence/')) continue;
    let path: string;
    try {
      path = evidence.url.startsWith('/')
        ? evidence.url
        : new URL(evidence.url).pathname;
    } catch {
      throw new ForbiddenException('Invalid evidence receipt');
    }
    const match = /^\/card\/evidence\/(\d+)\/content\/([A-Za-z0-9_-]+)$/.exec(
      path,
    );
    if (!match || Number(match[1]) !== Number(siteId))
      throw new ForbiddenException('Invalid evidence receipt');
    const objectKey = Buffer.from(match[2], 'base64url').toString('utf8');
    const prefix = `site_${siteId}/cards/${cardUUID}/`;
    const suffix = objectKey.slice(prefix.length);
    const identity =
      /^(images|videos|audios)\/([A-Z]{4})_[A-Za-z0-9_-]+\.[a-z0-9]+$/.exec(
        suffix,
      );
    if (
      !objectKey.startsWith(prefix) ||
      !identity ||
      identity[2] !== evidence.type
    ) {
      throw new ForbiddenException(
        'Evidence reference belongs to another card',
      );
    }
    const receipt = await manager.findOne(CardEvidenceUploadEntity, {
      where: { objectKey },
    });
    // Objects uploaded before reservations were introduced keep their references.
    // Conditional writes prevent any replacement of those legacy objects.
    if (!receipt) continue;
    if (
      receipt.status !== 'UPLOADED' ||
      Number(receipt.siteId) !== Number(siteId) ||
      receipt.cardUUID !== cardUUID ||
      Number(receipt.ownerId) !== ownerId ||
      receipt.evidenceType !== evidence.type
    )
      throw new ForbiddenException(
        'Evidence receipt does not belong to this operation',
      );
  }
}
