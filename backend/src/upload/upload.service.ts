import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/** Local fallback folder (also served at /uploads by main.ts). */
export const UPLOAD_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
export const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

export interface UploadResult {
  /** Absolute URL (Cloudflare R2) or "/uploads/<file>" (local fallback). */
  url: string;
  provider: 'cloudflare-r2' | 'local';
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Uploads to Cloudflare R2 (S3-compatible API). When R2 is not configured — e.g. local development —
 * files are written to ./uploads so everything still works without credentials.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly r2: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const get = (k: string) => this.config.get<string>(k)?.trim() || '';
    const endpoint = get('CLOUDFLARE_S3_API_ENDPOINT');
    const accessKeyId = get('CLOUDFLARE_ACCESSKEY_ID');
    // accept the older misspelt name too, so env files can be shared between projects
    const secretAccessKey = get('CLOUDFLARE_SECRETACCESS_KEY') || get('CLOUDFLARE_SECRETACESS_KEY');
    this.bucket = get('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = get('CLOUDFLARE_R2_PUBLIC_URL').replace(/\/+$/, '');

    if (endpoint && accessKeyId && secretAccessKey && this.bucket && this.publicUrl) {
      this.r2 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`Uploads → Cloudflare R2 bucket "${this.bucket}"`);
    } else {
      this.r2 = null;
      const partial = endpoint || accessKeyId || secretAccessKey || this.bucket;
      this.logger.warn(
        partial
          ? 'Cloudflare R2 is only partly configured (needs endpoint, access key, secret, bucket AND CLOUDFLARE_R2_PUBLIC_URL) — using local disk.'
          : 'Cloudflare R2 not configured — uploads are stored on local disk.',
      );
    }
  }

  /** `kind` limits what is accepted: "image", "video" or "any". */
  async upload(file: Express.Multer.File | undefined, kind: 'image' | 'video' | 'any'): Promise<UploadResult> {
    if (!file) throw new BadRequestException('No file uploaded');

    const imageExt = IMAGE_TYPES[file.mimetype];
    const videoExt = VIDEO_TYPES[file.mimetype];
    const ext = kind === 'video' ? videoExt : kind === 'image' ? imageExt : (imageExt ?? videoExt);
    if (!ext) {
      throw new BadRequestException(
        kind === 'video'
          ? 'Only MP4, WebM or MOV videos are allowed'
          : kind === 'image'
            ? 'Only JPG, PNG, WEBP or GIF images are allowed'
            : 'Only JPG, PNG, WEBP, GIF images or MP4, WebM, MOV videos are allowed',
      );
    }

    const folder = videoExt && ext === videoExt ? 'videos' : 'images';
    const name = `${randomUUID()}${ext}`; // never trust the client's filename

    if (this.r2) {
      const key = `${folder}/${name}`;
      try {
        await this.r2.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            CacheControl: 'public, max-age=31536000, immutable', // names are unique, so safe to cache for a year
          }),
        );
        return { url: `${this.publicUrl}/${key}`, provider: 'cloudflare-r2', filename: key, size: file.size, mimetype: file.mimetype };
      } catch (err) {
        this.logger.error(`R2 upload failed, falling back to local disk: ${(err as Error).message}`);
      }
    }

    await writeFile(join(UPLOAD_DIR, name), file.buffer);
    return { url: `/uploads/${name}`, provider: 'local', filename: name, size: file.size, mimetype: file.mimetype };
  }
}
