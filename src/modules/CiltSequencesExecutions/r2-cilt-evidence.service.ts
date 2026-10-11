import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

/**
 * Uploads CILT sequence execution evidence (photos) to Cloudflare R2 and
 * returns the public URL, mirroring the card evidence R2 service but kept
 * simple and specific to CILT executions.
 */
@Injectable()
export class R2CiltEvidenceService {
  private readonly logger = new Logger(R2CiltEvidenceService.name);
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = this.required('CLOUDFLARE_R2_ACCESS_KEY');
    const secretAccessKey = this.required('CLOUDFLARE_R2_SECRET_KEY');
    this.bucket = this.required('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = this.required('CLOUDFLARE_R2_PUBLIC_URL').replace(/\/+$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.required('CLOUDFLARE_R2_ENDPOINT').replace(/\/+$/, ''),
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadExecutionEvidence(
    siteId: number,
    executionId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const extension = this.extensionFor(file.mimetype);
    const key = `site_${siteId}/cilt-executions/${executionId}/${randomUUID()}${extension}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.buffer.length,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error) {
      this.logger.error(
        `Cloudflare R2 CILT evidence upload failed for site ${siteId}`,
        error as Error,
      );
      throw new BadGatewayException(
        'Evidence storage is temporarily unavailable',
      );
    }
    return `${this.publicUrl}/${key}`;
  }

  private extensionFor(mimetype: string): string {
    switch (mimetype) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '';
    }
  }

  private required(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }
}
