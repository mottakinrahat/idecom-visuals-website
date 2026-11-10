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
import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { DbService } from '../db/db.service';
import { PgCollection, TableSpec } from '../db/pg-collection';

export const LEAD_SERVICES = ['Video Production', 'Brand Design', 'Reels Package', 'Marketing', 'Full Retainer'] as const;
export const LEAD_STAGES = ['New Inquiry', 'Proposal Sent', 'In Production', 'Review', 'Completed'] as const;

/** Table `crm_leads` — one row per client / deal in the CRM pipeline. */
export interface CrmLead {
  id: string;
  client: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  budget: number;
  stage: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

export class UpsertLeadDto {
  @Transform(trim) @IsString() @MinLength(1, { message: 'Client name is required' }) @MaxLength(120) client!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) company?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(160) email?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsIn(LEAD_SERVICES as unknown as string[]) service!: string;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1_000_000_000) budget!: number;
  @IsIn(LEAD_STAGES as unknown as string[]) stage!: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(20) dueDate?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}

const LEAD_SPEC: TableSpec<CrmLead> = {
  id: 'text',
  client: 'text',
  company: 'text',
  email: 'text',
  phone: 'text',
  service: 'text',
  budget: 'num',
  stage: 'text',
  dueDate: 'text',
  notes: 'text',
  createdAt: 'ts',
  updatedAt: 'ts',
};

@Injectable()
export class CrmService implements OnModuleInit {
  private readonly col: PgCollection<CrmLead>;

  constructor(db: DbService) {
    this.col = new PgCollection<CrmLead>(db.pool, 'crm_leads', LEAD_SPEC);
  }

  async onModuleInit() {
    await this.col.ready;
  }

  list(): CrmLead[] {
    return [...this.col.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Create or replace the lead with this id (the dashboard picks the id, so retries are safe). */
  async upsert(id: string, dto: UpsertLeadDto): Promise<CrmLead> {
    const cur = this.col.find(id);
    const now = new Date().toISOString();
    const lead: CrmLead = {
      id,
      client: dto.client,
      company: dto.company ?? '',
      email: dto.email ?? '',
      phone: dto.phone ?? '',
      service: dto.service,
      budget: dto.budget,
      stage: dto.stage,
      dueDate: dto.dueDate ?? '',
      notes: dto.notes ?? '',
      createdAt: cur?.createdAt ?? now,
      updatedAt: now,
    };
    await this.col.save(cur ? this.col.all().map((l) => (l.id === id ? lead : l)) : [...this.col.all(), lead]);
    return lead;
  }

  async remove(id: string): Promise<void> {
    if (!this.col.find(id)) throw new NotFoundException('Lead not found');
    await this.col.save(this.col.all().filter((l) => l.id !== id));
  }
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const checkId = (id: string) => {
  if (!ID.test(id)) throw new NotFoundException('Lead not found');
  return id;
};

@Controller('crm-leads')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Put(':id')
  upsert(@Param('id') id: string, @Body() dto: UpsertLeadDto) {
    return this.service.upsert(checkId(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(checkId(id));
  }
}

@Module({ controllers: [CrmController], providers: [CrmService] })
export class CrmModule {}
