import { errorDiagnostics } from 'src/common/exceptions/error-details';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import * as sharp from 'sharp';
import { CardEvidenceUploadType } from './models/dto/upload-card-evidence.dto';

export interface UploadedCardEvidence {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

export interface DownloadedCardEvidence {
  buffer: Buffer;
  contentType: string;
  size: number;
  fileName: string;
}

@Injectable()
export class R2CardEvidenceService {
  private readonly logger = new Logger(R2CardEvidenceService.name);
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = this.required('CLOUDFLARE_R2_ACCESS_KEY');
    const secretAccessKey = this.required('CLOUDFLARE_R2_SECRET_KEY');
    this.bucket = this.required('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = this.required('CLOUDFLARE_R2_PUBLIC_URL').replace(
      /\/+$/,
      '',
    );
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.required('CLOUDFLARE_R2_ENDPOINT').replace(/\/+$/, ''),
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadCardEvidence(
    siteId: number,
    cardUUID: string,
    evidenceId: string,
    evidenceType: CardEvidenceUploadType,
    file: Express.Multer.File,
  ): Promise<UploadedCardEvidence> {
    const key = this.buildKey(
      siteId,
      cardUUID,
      evidenceId,
      evidenceType,
      file.mimetype,
    );
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.buffer.length,
          CacheControl: 'public, max-age=31536000, immutable',
          IfNoneMatch: '*',
          Metadata: { sha256: hash },
        }),
      );
    } catch (error) {
      const status = error?.$metadata?.httpStatusCode;
      if (
        status === 412 ||
        status === 409 ||
        error?.name === 'PreconditionFailed'
      ) {
        const object = await this.client
          .send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
          .catch(() => {
            throw new BadGatewayException(
              'Evidence storage is temporarily unavailable',
            );
          });
        if (
          object.Metadata?.sha256 !== hash ||
          object.ContentType !== file.mimetype ||
          object.ContentLength !== file.buffer.length
        ) {
          throw new ConflictException('Evidence is immutable');
        }
      } else {
        this.logger.error(
          `Cloudflare R2 upload failed for site ${siteId}`,
          JSON.stringify(errorDiagnostics(error)),
        );
        throw new BadGatewayException(
          'Evidence storage is temporarily unavailable',
        );
      }
    }
    const token = Buffer.from(key, 'utf8').toString('base64url');
    return {
      url: `/card/evidence/${siteId}/content/${token}`,
      key,
      contentType: file.mimetype,
      size: file.buffer.length,
    };
  }

  buildKey(
    siteId: number,
    cardUUID: string,
    evidenceId: string,
    evidenceType: CardEvidenceUploadType,
    mimeType: string,
  ): string {
    const expectedMedia = evidenceType.slice(0, 2);
    const fileMedia = this.mediaCode(mimeType);
    if (expectedMedia !== fileMedia) {
      throw new BadRequestException(
        'Evidence type does not match the uploaded file',
      );
    }
    const folder = this.folderFor(fileMedia);
    const extension = this.extensionFor(mimeType);
    // Stable keys make background retries idempotent and avoid duplicate objects.
    return `site_${siteId}/cards/${cardUUID}/${folder}/${evidenceType}_${evidenceId}${extension}`;
  }

  async downloadCardEvidence(
    siteId: number,
    token: string,
  ): Promise<DownloadedCardEvidence> {
    let key: string;
    try {
      key = Buffer.from(token, 'base64url').toString('utf8');
    } catch {
      throw new BadRequestException('Invalid evidence reference');
    }
    this.assertSiteKey(siteId, key);
    return this.downloadKey(key);
  }

  /**
   * Return a small cached thumbnail for an image evidence. The thumbnail is
   * generated once with sharp and stored in R2 next to the original (key
   * suffixed with `.thumb.jpg`); subsequent requests serve the cached object
   * so the server never re-encodes. Non-image evidences (or any thumbnail
   * failure) fall back to the original object.
   */
  async downloadCardEvidenceThumb(
    siteId: number,
    token: string,
  ): Promise<DownloadedCardEvidence> {
    let key: string;
    try {
      key = Buffer.from(token, 'base64url').toString('utf8');
    } catch {
      throw new BadRequestException('Invalid evidence reference');
    }
    this.assertSiteKey(siteId, key);

    // Only images have thumbnails; everything else serves the original.
    if (!/\.(jpe?g|png|webp)$/i.test(key)) {
      return this.downloadKey(key);
    }

    const thumbKey = `${key}.thumb.jpg`;

    // 1) Serve the cached thumbnail if it already exists.
    try {
      const cached = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: thumbKey }),
      );
      if (cached.Body) {
        const bytes = await cached.Body.transformToByteArray();
        return {
          buffer: Buffer.from(bytes),
          contentType: cached.ContentType || 'image/jpeg',
          size: cached.ContentLength ?? bytes.byteLength,
          fileName: thumbKey.substring(thumbKey.lastIndexOf('/') + 1),
        };
      }
    } catch {
      // Not cached yet: fall through and generate it.
    }

    // 2) Generate the thumbnail from the original, cache it, and return it.
    try {
      const original = await this.downloadKey(key);
      const thumbBuffer = await sharp(original.buffer)
        .rotate()
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

      // Cache in R2 (best-effort: a failed write still serves the thumbnail).
      await this.client
        .send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: thumbKey,
            Body: thumbBuffer,
            ContentType: 'image/jpeg',
            ContentLength: thumbBuffer.length,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        )
        .catch((error) => {
          this.logger.warn(
            `Thumbnail cache write failed for ${thumbKey}: ${error?.message ?? error}`,
          );
        });

      return {
        buffer: thumbBuffer,
        contentType: 'image/jpeg',
        size: thumbBuffer.length,
        fileName: thumbKey.substring(thumbKey.lastIndexOf('/') + 1),
      };
    } catch (error) {
      // Any thumbnail failure must not break the UI: serve the original.
      this.logger.warn(
        `Thumbnail generation failed for ${key}, serving original: ${error?.message ?? error}`,
      );
      return this.downloadKey(key);
    }
  }

  async downloadLegacyCardEvidence(
    siteId: number,
    reference: string,
  ): Promise<DownloadedCardEvidence> {
    const expectedPrefix = `${this.publicUrl}/`;
    if (!reference.startsWith(expectedPrefix)) {
      throw new BadRequestException('Unsupported evidence reference');
    }
    const key = reference
      .slice(expectedPrefix.length)
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
    this.assertSiteKey(siteId, key);
    return this.downloadKey(key);
  }

  private async downloadKey(key: string): Promise<DownloadedCardEvidence> {
    try {
      const object = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!object.Body)
        throw new Error('Cloudflare R2 returned an empty object');
      const bytes = await object.Body.transformToByteArray();
      return {
        buffer: Buffer.from(bytes),
        contentType: object.ContentType || 'application/octet-stream',
        size: object.ContentLength ?? bytes.byteLength,
        fileName: key.substring(key.lastIndexOf('/') + 1),
      };
    } catch (error) {
      this.logger.error(
        'Cloudflare R2 download failed',
        JSON.stringify(errorDiagnostics(error)),
      );
      throw new BadGatewayException(
        'Evidence storage is temporarily unavailable',
      );
    }
  }

  private assertSiteKey(siteId: number, key: string): void {
    if (!key.startsWith(`site_${siteId}/cards/`) || key.includes('..')) {
      throw new BadRequestException('Invalid evidence reference');
    }
  }

  private required(name: string): string {
    const value = this.config.get<string>(name)?.trim();
    if (!value) {
      throw new InternalServerErrorException(`${name} is not configured`);
    }
    return value;
  }

  private mediaCode(mimeType: string): 'IM' | 'VI' | 'AU' {
    if (ALLOWED_IMAGE_TYPES.has(mimeType)) return 'IM';
    if (ALLOWED_VIDEO_TYPES.has(mimeType)) return 'VI';
    if (ALLOWED_AUDIO_TYPES.has(mimeType)) return 'AU';
    throw new BadRequestException('Unsupported evidence file type');
  }

  private folderFor(mediaCode: 'IM' | 'VI' | 'AU'): string {
    if (mediaCode === 'IM') return 'images';
    if (mediaCode === 'VI') return 'videos';
    return 'audios';
  }

  private extensionFor(mimeType: string): string {
    const extension = MIME_EXTENSIONS[mimeType];
    if (!extension)
      throw new BadRequestException('Unsupported evidence file type');
    return extension;
  }
}

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
export const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);
export const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/aac',
]);

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/webm': '.webm',
  'audio/aac': '.aac',
};
