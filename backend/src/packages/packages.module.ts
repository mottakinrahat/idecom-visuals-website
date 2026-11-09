import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { randomUUID } from 'crypto';
import { JsonCollection, dataPath } from '../equipment/store/data-store';

export interface StudioPackage {
  id: string;
  number: string; // "01", "02", "03", "04"
  title: string; // "Content Shooting"
  subtitle: string; // "(Indoor)"
  iconType: 'camera' | 'location' | 'user' | 'store';
  imageUrl: string;
  tierName: string; // "Standard" | "Premium"
  highlighted: boolean;
  price: number; // in BDT (৳)
  duration: string;
  features: string[];
  updatedAt: string;
}

export const INITIAL_PACKAGES: StudioPackage[] = [
  {
    id: 'pkg-01-std',
    number: '01',
    title: 'Content Shooting',
    subtitle: '(Indoor)',
    iconType: 'camera',
    imageUrl:
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Standard',
    highlighted: false,
    price: 4500,
    duration: '2 Hours',
    features: [
      '1x Sony A7 V, tripod-mounted',
      '1 set backdrop of your choice',
      'Basic 2-point lighting',
      '1 in-house camera operator',
      'Raw footage delivered same day',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-01-prm',
    number: '01',
    title: 'Content Shooting',
    subtitle: '(Indoor)',
    iconType: 'camera',
    imageUrl:
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Premium',
    highlighted: true,
    price: 10000,
    duration: '4 hours + 30 min extra',
    features: [
      '2x Sony A7 V, multi-angle simultaneous',
      'All backdrops, up to 3 set changes',
      'Camera operator + on-set assistant',
      'Props, softbox + reflector setup',
      '1-Basic short-form Reels',
      'Priority same-day raw delivery up to 4K',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-02-std',
    number: '02',
    title: 'Outdoor Shoot',
    subtitle: '(Near IDeCom Office)',
    iconType: 'location',
    imageUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Standard',
    highlighted: false,
    price: 5999,
    duration: 'Half-day • 5 Hours',
    features: [
      '1x Sony A7 V, guided posing/direction',
      '1 Camera operator + 1 assistant',
      'Portable Led Light',
      'Wireless lapel mic',
      'Gimbal Stabilizer',
      'Reflector/diffuser for natural light',
      'Raw audio + Up to 4K video delivered',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-02-prm',
    number: '02',
    title: 'Outdoor Shoot',
    subtitle: '(Near IDeCom Office)',
    iconType: 'location',
    imageUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Premium',
    highlighted: true,
    price: 11499,
    duration: 'Half-day • 5 hours + 30 min extra',
    features: [
      '1x Sony A7 V, guided posing/direction',
      '1 Camera operator + 2 assistant',
      'Portable Led Light',
      'Wireless lapel mic',
      'Gimbal Stabilizer',
      'Reflector/diffuser for natural light',
      '2min Edited Video or 2 Short-form Reels (60sec)',
      'Priority Delivery in 24-72 hours.',
      'Raw audio + video delivered on demand',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-03-std',
    number: '03',
    title: 'Personal Branding',
    subtitle: '',
    iconType: 'user',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Standard',
    highlighted: false,
    price: 7999,
    duration: 'Half-day • 3 Hours',
    features: [
      '2 outfits/looks, 1-2 set changes',
      '1x Sony A7 V, guided posing/direction',
      '1 short-form talking-head reel',
      'Delivery in 3-4 working days',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-03-prm',
    number: '03',
    title: 'Personal Branding',
    subtitle: '',
    iconType: 'user',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Premium',
    highlighted: true,
    price: 14999,
    duration: 'Full-day • 6 Hours + 30 min extra',
    features: [
      'Up to 3 outfit/look changes, all sets',
      '2x Sony A7 V, photo + video',
      'Pre-shoot styling & moodboard session',
      '1 short-form talking-head reel',
      'Delivery in 5 working days',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-04-std',
    number: '04',
    title: 'Small Business',
    subtitle: '',
    iconType: 'store',
    imageUrl:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Standard',
    highlighted: false,
    price: 4999,
    duration: 'Half-day • 2.5 Hours',
    features: [
      '1 Script based on Business',
      '1 set backdrop of your choice',
      'Basic 2-point lighting',
      '1 in-house camera operator',
      '1x Sony A7 V, tripod-mounted',
      'Wireless lapel mic',
      'Reflector/diffuser for natural light',
      'Basic edited video delivery within 72 hours.',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-04-prm',
    number: '04',
    title: 'Small Business',
    subtitle: '',
    iconType: 'store',
    imageUrl:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80',
    tierName: 'Premium',
    highlighted: true,
    price: 7999,
    duration: 'Half-day • 3 Hours',
    features: [
      '1 Script based on Business',
      'Camera operator + Assistance',
      '1x Sony A7 V, tripod-mounted',
      'Wireless lapel mic',
      'Reflector/diffuser for natural light',
      'Studio Indoor (If Outdoor, additional cost will be added)',
      'Regular edited video + motion delivery within 72 hours.',
    ],
    updatedAt: new Date().toISOString(),
  },
];

export class UpsertPackageDto {
  @IsString()
  number!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  iconType?: 'camera' | 'location' | 'user' | 'store';

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @MinLength(1)
  tierName!: string;

  @IsBoolean()
  highlighted!: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  duration!: string;

  @IsArray()
  @IsString({ each: true })
  features!: string[];
}

@Injectable()
export class PackagesService {
  private readonly col = new JsonCollection<StudioPackage>(
    dataPath('packages'),
  );

  constructor() {
    const existing = this.col.all() as unknown as Record<string, unknown>[];
    if (
      existing.length === 0 ||
      existing.some((item) => Array.isArray(item.tiers))
    ) {
      void this.col.save(INITIAL_PACKAGES);
    }
  }

  list(): StudioPackage[] {
    return this.col.all();
  }

  async create(dto: UpsertPackageDto): Promise<StudioPackage> {
    const pkg: StudioPackage = {
      id: `pkg-${randomUUID().slice(0, 8)}`,
      number:
        dto.number.trim() ||
        String(this.col.all().length + 1).padStart(2, '0'),
      title: dto.title.trim(),
      subtitle: (dto.subtitle ?? '').trim(),
      iconType: dto.iconType ?? 'camera',
      imageUrl: (dto.imageUrl ?? '').trim(),
      tierName: dto.tierName.trim() || 'Standard',
      highlighted: !!dto.highlighted,
      price: Number(dto.price) || 0,
      duration: dto.duration.trim(),
      features: dto.features.map((f) => f.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    await this.col.save([...this.col.all(), pkg]);
    return pkg;
  }

  async update(id: string, dto: UpsertPackageDto): Promise<StudioPackage> {
    const current = this.col.find(id);
    if (!current) throw new NotFoundException('Package not found');
    const updated: StudioPackage = {
      ...current,
      number: dto.number.trim() || current.number,
      title: dto.title.trim(),
      subtitle: (dto.subtitle ?? '').trim(),
      iconType: dto.iconType ?? current.iconType,
      imageUrl: (dto.imageUrl ?? '').trim(),
      tierName: dto.tierName.trim() || current.tierName,
      highlighted: !!dto.highlighted,
      price: Number(dto.price) || 0,
      duration: dto.duration.trim(),
      features: dto.features.map((f) => f.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    await this.col.save(this.col.all().map((p) => (p.id === id ? updated : p)));
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!this.col.find(id)) throw new NotFoundException('Package not found');
    await this.col.save(this.col.all().filter((p) => p.id !== id));
  }

  async reset(): Promise<StudioPackage[]> {
    await this.col.save(INITIAL_PACKAGES);
    return INITIAL_PACKAGES;
  }
}

@Controller('packages')
export class PackagesController {
  constructor(private readonly service: PackagesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: UpsertPackageDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: UpsertPackageDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertPackageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post('reset')
  reset() {
    return this.service.reset();
  }
}

@Module({
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
