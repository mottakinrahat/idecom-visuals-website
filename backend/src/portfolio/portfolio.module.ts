import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  OnModuleInit,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsHexColor,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { randomUUID } from 'crypto';
import { DbService } from '../db/db.service';
import { PgCollection, TableSpec } from '../db/pg-collection';
import { dataPath } from '../equipment/store/data-store';

export type VideoType = 'video' | 'reel';

/** One row of the "video portfolio" table. */
export interface PortfolioVideo {
  id: string;
  title: string;
  link: string; // YouTube / Facebook / direct file URL (may be empty while drafting)
  thumbnailUrl: string; // empty → the site shows its default thumbnail
  category: string; // "Brand film", "Commercial", …
  videoType: VideoType; // "video" → 16:9 Featured videos, "reel" → 9:16 Reels
  duration: string; // "00:01:12"
  watermark: string; // big faint word on the card
  glowColor: string;
  baseColor: string;
  sortOrder: number; // lower = shown first
  createdAt: string;
  updatedAt: string;
}

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

// uploaded images are absolute https URLs (R2) or "/uploads/…"; inline base64 is rejected on purpose
const IMAGE_URL = /^(https?:\/\/\S+|\/uploads\/\S+)$/;

export class CreatePortfolioVideoDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(120)
  title!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(600)
  link?: string;

  @Transform(trim)
  @IsOptional()
  @Matches(IMAGE_URL, { message: 'Thumbnail must be an uploaded image or an https link', each: false })
  @MaxLength(600)
  thumbnailUrl?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsIn(['video', 'reel'], { message: 'videoType must be "video" or "reel"' })
  videoType!: VideoType;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  duration?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(24)
  watermark?: string;

  @IsOptional()
  @IsHexColor()
  glowColor?: string;

  @IsOptional()
  @IsHexColor()
  baseColor?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/** PATCH: same fields, all optional (the type of an existing item can be changed too). */
export class UpdatePortfolioVideoDto {
  @Transform(trim) @IsOptional() @IsString() @MinLength(1) @MaxLength(120) title?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(600) link?: string;
  @Transform(trim) @IsOptional() @Matches(new RegExp(`${IMAGE_URL.source}|^$`), { message: 'Thumbnail must be an uploaded image or an https link' }) @MaxLength(600) thumbnailUrl?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(60) category?: string;
  @IsOptional() @IsIn(['video', 'reel']) videoType?: VideoType;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(20) duration?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(24) watermark?: string;
  @IsOptional() @IsHexColor() glowColor?: string;
  @IsOptional() @IsHexColor() baseColor?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

const now = () => new Date().toISOString();
const seed = (
  videoType: VideoType,
  order: number,
  watermark: string,
  category: string,
  title: string,
  duration: string,
  glowColor: string,
  baseColor: string,
): PortfolioVideo => ({
  id: randomUUID(),
  title,
  link: '',
  thumbnailUrl: '',
  category,
  videoType,
  duration,
  watermark,
  glowColor,
  baseColor,
  sortOrder: order,
  createdAt: now(),
  updatedAt: now(),
});

/** Placeholder items so a brand-new install doesn't show an empty section (edit or delete them in the CMS). */
const SEED: PortfolioVideo[] = [
  seed('video', 1, 'Launch', 'Brand film', 'Café opening launch film', '00:01:12', '#3f6f12', '#1a2a0b'),
  seed('video', 2, 'Glow', 'Commercial', 'Skincare product commercial', '00:00:45', '#7a4a2b', '#26170e'),
  seed('video', 3, 'Live', 'Event', 'Music night highlights', '00:02:30', '#2b4f7a', '#0e1826'),
  seed('video', 4, 'Craft', 'Documentary', 'Inside a handloom workshop', '00:04:10', '#6b5a2a', '#1f1a0b'),
  seed('reel', 5, 'Food', 'Reel', 'Burger drop', '00:00:28', '#8a2f2f', '#240c0c'),
  seed('reel', 6, 'Style', 'Reel', 'Eid fashion edit', '00:00:32', '#5a2f7a', '#170c24'),
  seed('reel', 7, 'Tech', 'Reel', 'Phone unboxing', '00:00:41', '#4a6a10', '#121a05'),
  seed('reel', 8, 'Travel', 'Reel', 'Weekend by the sea', '00:00:36', '#1f6b72', '#081d20'),
];

const PORTFOLIO_SPEC: TableSpec<PortfolioVideo> = {
  id: 'text',
  title: 'text',
  link: 'text',
  thumbnailUrl: 'text',
  category: 'text',
  videoType: 'text',
  duration: 'text',
  watermark: 'text',
  glowColor: 'text',
  baseColor: 'text',
  sortOrder: 'int',
  createdAt: 'ts',
  updatedAt: 'ts',
};

@Injectable()
export class PortfolioService implements OnModuleInit {
  private readonly col: PgCollection<PortfolioVideo>;

  constructor(db: DbService) {
    // seed rows are inserted only the very first time, never again after the owner deletes them
    this.col = new PgCollection<PortfolioVideo>(db.pool, 'portfolio_videos', PORTFOLIO_SPEC, {
      legacyFile: dataPath('portfolio_videos'),
      seed: SEED,
    });
  }

  async onModuleInit() {
    await this.col.ready;
  }

  list(type?: VideoType): PortfolioVideo[] {
    return this.col
      .all()
      .filter((v) => !type || v.videoType === type)
      .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
  }

  async create(dto: CreatePortfolioVideoDto): Promise<PortfolioVideo> {
    const all = this.col.all();
    const first = all.reduce((m, v) => Math.min(m, v.sortOrder), 1);
    const item: PortfolioVideo = {
      id: randomUUID(),
      title: dto.title,
      link: dto.link ?? '',
      thumbnailUrl: dto.thumbnailUrl ?? '',
      category: dto.category ?? (dto.videoType === 'reel' ? 'Reel' : 'Brand film'),
      videoType: dto.videoType,
      duration: dto.duration ?? '',
      watermark: dto.watermark ?? '',
      glowColor: dto.glowColor ?? (dto.videoType === 'reel' ? '#5a2f7a' : '#3f6f12'),
      baseColor: dto.baseColor ?? (dto.videoType === 'reel' ? '#170c24' : '#1a2a0b'),
      sortOrder: dto.sortOrder ?? first - 1, // new items appear first
      createdAt: now(),
      updatedAt: now(),
    };
    await this.col.save([...all, item]);
    return item;
  }

  async update(id: string, dto: UpdatePortfolioVideoDto): Promise<PortfolioVideo> {
    const cur = this.col.find(id);
    if (!cur) throw new NotFoundException('Video not found');
    const patch = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    const next: PortfolioVideo = { ...cur, ...patch, updatedAt: now() };
    await this.col.save(this.col.all().map((v) => (v.id === id ? next : v)));
    return next;
  }

  async remove(id: string): Promise<void> {
    if (!this.col.find(id)) throw new NotFoundException('Video not found');
    await this.col.save(this.col.all().filter((v) => v.id !== id));
  }
}

@Controller('portfolio-videos')
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  /** Public: GET /api/portfolio-videos?type=video|reel */
  @Get()
  list(@Query('type') type?: string) {
    return this.service.list(type === 'video' || type === 'reel' ? type : undefined);
  }

  @Post()
  create(@Body() dto: CreatePortfolioVideoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioVideoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
