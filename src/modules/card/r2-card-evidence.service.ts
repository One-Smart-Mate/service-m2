import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import sharp = require('sharp');
import {
  CardEvidenceUploadType,
} from './models/dto/upload-card-evidence.dto';

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
    this.publicUrl = this.required('CLOUDFLARE_R2_PUBLIC_URL').replace(/\/+$/, '');
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
    const expectedMedia = evidenceType.slice(0, 2);
    const fileMedia = this.mediaCode(file.mimetype);
    if (expectedMedia !== fileMedia) {
      throw new BadRequestException('Evidence type does not match the uploaded file');
    }
    const folder = this.folderFor(fileMedia);
    const extension = this.extensionFor(file.mimetype);
    // Stable keys make background retries idempotent and avoid duplicate objects.
    const key = `site_${siteId}/cards/${cardUUID}/${folder}/${evidenceType}_${evidenceId}${extension}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error) {
      this.logger.error(
        `Cloudflare R2 upload failed for site ${siteId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadGatewayException('Evidence storage is temporarily unavailable');
    }
    const token = Buffer.from(key, 'utf8').toString('base64url');
    return {
      // Store a service route instead of an R2 URL. Mobile/web clients never
      // communicate with Cloudflare directly.
      url: `/card/evidence/${siteId}/content/${token}`,
      key,
      contentType: file.mimetype,
      size: file.size,
    };
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

  // Return a small, compressed thumbnail for an image evidence. The thumbnail is
  // generated once (on first request) and cached in R2 next to the original, so
  // list views load fast without re-downloading multi-MB photos. Non-image
  // evidences (video/audio) fall back to the original object unchanged.
  async downloadCardEvidenceThumbnail(
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

    // Only images get a thumbnail; anything else streams as-is.
    if (!/\.(jpe?g|png|webp)$/i.test(key)) {
      return this.downloadKey(key);
    }

    const thumbKey = this.thumbnailKeyFor(key);

    // 1) Serve the cached thumbnail if it already exists.
    try {
      return await this.downloadKey(thumbKey);
    } catch {
      // Not cached yet — generate it below.
    }

    // 2) Generate from the original, cache it, and return it.
    try {
      const original = await this.downloadKey(key);
      const thumbBuffer = await sharp(original.buffer)
        .rotate() // respect EXIF orientation
        .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();

      try {
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: thumbKey,
            Body: thumbBuffer,
            ContentType: 'image/jpeg',
            ContentLength: thumbBuffer.byteLength,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );
      } catch (error) {
        // Caching is best-effort; still return the generated thumbnail.
        this.logger.warn(
          `Thumbnail cache write failed for ${thumbKey}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      return {
        buffer: thumbBuffer,
        contentType: 'image/jpeg',
        size: thumbBuffer.byteLength,
        fileName: thumbKey.substring(thumbKey.lastIndexOf('/') + 1),
      };
    } catch (error) {
      // If thumbnail generation fails, degrade gracefully to the original.
      this.logger.warn(
        `Thumbnail generation failed for ${key}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.downloadKey(key);
    }
  }

  // Derive the thumbnail object key for an image key:
  // site_x/cards/<uuid>/images/IMCR_<id>.jpg
  //   -> site_x/cards/<uuid>/images/thumbs/IMCR_<id>.jpg
  private thumbnailKeyFor(key: string): string {
    const slash = key.lastIndexOf('/');
    const dir = key.substring(0, slash);
    const file = key.substring(slash + 1);
    const base = file.replace(/\.[^.]+$/, '');
    return `${dir}/thumbs/${base}.jpg`;
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
      if (!object.Body) throw new Error('Cloudflare R2 returned an empty object');
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
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadGatewayException('Evidence storage is temporarily unavailable');
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
    if (!extension) throw new BadRequestException('Unsupported evidence file type');
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
