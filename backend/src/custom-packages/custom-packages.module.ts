import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  OnModuleInit,
  Param,
  Put,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DbService } from '../db/db.service';
import { PgCollection, TableSpec } from '../db/pg-collection';

/** Table `custom_packages` — packages built with the "Custom Package" page (equipment hours + editing + extra costs − discount). */
export interface CustomPackage {
  id: string;
  name: string;
  client: string;
  equipment: unknown[]; // [{ equipmentId, name, pricePerHour, value, unit, qty }]
  editing: Record<string, unknown>; // { enabled, videos, pricePerVideo }
  extras: unknown[]; // [{ purpose, label, qty, amount }]
  discount: Record<string, unknown>; // { type: 'percent' | 'fixed', value }
  createdAt: string;
  updatedAt: string;
}

const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

export class UpsertCustomPackageDto {
  @Transform(trim) @IsString() @MinLength(2, { message: 'Package name is required' }) @MaxLength(120) name!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) client?: string;
  @IsArray() @ArrayMaxSize(100) equipment!: unknown[];
  @IsObject() editing!: Record<string, unknown>;
  @IsArray() @ArrayMaxSize(100) extras!: unknown[];
  @IsObject() discount!: Record<string, unknown>;
  @IsOptional() @IsString() createdAt?: string; // sent by the dashboard; the server keeps the original value on update
}

const SPEC: TableSpec<CustomPackage> = {
  id: 'text',
  name: 'text',
  client: 'text',
  equipment: 'json',
  editing: 'json',
  extras: 'json',
  discount: 'json',
  createdAt: 'ts',
  updatedAt: 'ts',
};

@Injectable()
export class CustomPackagesService implements OnModuleInit {
  private readonly col: PgCollection<CustomPackage>;

  constructor(db: DbService) {
    this.col = new PgCollection<CustomPackage>(db.pool, 'custom_packages', SPEC);
  }

  async onModuleInit() {
    await this.col.ready;
  }

  list(): CustomPackage[] {
    return [...this.col.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsert(id: string, dto: UpsertCustomPackageDto): Promise<CustomPackage> {
    const cur = this.col.find(id);
    const now = new Date().toISOString();
    const pkg: CustomPackage = {
      id,
      name: dto.name,
      client: dto.client ?? '',
      equipment: dto.equipment,
      editing: dto.editing,
      extras: dto.extras,
      discount: dto.discount,
      createdAt: cur?.createdAt ?? (dto.createdAt && !Number.isNaN(Date.parse(dto.createdAt)) ? dto.createdAt : now),
      updatedAt: now,
    };
    await this.col.save(cur ? this.col.all().map((p) => (p.id === id ? pkg : p)) : [...this.col.all(), pkg]);
    return pkg;
  }

  async remove(id: string): Promise<void> {
    if (!this.col.find(id)) throw new NotFoundException('Custom package not found');
    await this.col.save(this.col.all().filter((p) => p.id !== id));
  }
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const checkId = (id: string) => {
  if (!ID.test(id)) throw new NotFoundException('Custom package not found');
  return id;
};

@Controller('custom-packages')
export class CustomPackagesController {
  constructor(private readonly service: CustomPackagesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Put(':id')
  upsert(@Param('id') id: string, @Body() dto: UpsertCustomPackageDto) {
    return this.service.upsert(checkId(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(checkId(id));
  }
}

@Module({ controllers: [CustomPackagesController], providers: [CustomPackagesService] })
export class CustomPackagesModule {}
