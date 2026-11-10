import { Body, Controller, Get, Module, NotFoundException, Param, Put } from '@nestjs/common';
import { IsObject } from 'class-validator';
import { KvService } from '../db/kv.service';
import { SiteContentService } from './site-content.service';

/** Small documents the dashboard edits as a whole (stored as JSON in table `kv_store`). */
const KV_KEYS = new Set(['package-meta']);

export class SaveContentDto {
  @IsObject({ message: 'data must be an object' })
  data!: Record<string, unknown>;
}

@Controller('content')
export class ContentController {
  constructor(
    private readonly kv: KvService,
    private readonly site: SiteContentService,
  ) {}

  /**
   * Public (the website reads it). `{ data: null }` means nothing saved yet → the site uses its built-in defaults.
   * `site` is assembled from the relational tables (brands, stats, services, team, contact, headings).
   */
  @Get(':key')
  async get(@Param('key') key: string) {
    if (key === 'site') return { data: await this.site.load() };
    if (!KV_KEYS.has(key)) throw new NotFoundException('Unknown content key');
    return { data: await this.kv.get(key) };
  }

  @Put(':key')
  async save(@Param('key') key: string, @Body() dto: SaveContentDto) {
    if (key === 'site') await this.site.save(dto.data);
    else if (KV_KEYS.has(key)) await this.kv.set(key, dto.data);
    else throw new NotFoundException('Unknown content key');
    return { ok: true };
  }
}

@Module({ controllers: [ContentController], providers: [SiteContentService] })
export class ContentModule {}
