import {
  BadRequestException,
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
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { randomUUID } from 'crypto';
import { JsonCollection, dataPath } from '../equipment/store/data-store';

export const INQUIRY_CATEGORIES = [
  'E-commerce',
  'Restaurant & Food',
  'Fashion & Clothing',
  'Beauty & Health',
  'Real Estate',
  'Education & Courses',
  'Technology & Software',
  'Events & Wedding',
  'Travel & Tourism',
  'Personal Brand / Creator',
  'Other',
] as const;

/** pending → (phone call) → verified → accepted (+ CRM lead). rejected at any point. */
export type InquiryStatus = 'pending' | 'verified' | 'accepted' | 'rejected';

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  facebookUrl: string;
  website: string;
  category: string;
  description: string;
  status: InquiryStatus;
  createdAt: string;
  verifiedAt?: string;
  verifyNote?: string;
  acceptedAt?: string;
  leadId?: string;
  rejectedAt?: string;
  rejectReason?: string;
}

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
// "" → undefined so optional fields can simply be left empty
const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : trim({ value });

export class CreateInquiryDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(80)
  name!: string;

  @Transform(trim)
  @IsString()
  @Matches(/^[0-9+()\-\s]{7,20}$/, {
    message: 'Enter a valid phone number (7–20 digits)',
  })
  phone!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(120)
  email?: string;

  @Transform(trim)
  @IsUrl({ require_protocol: true }, { message: 'Enter a valid Facebook page link' })
  @MaxLength(300)
  facebookUrl!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Enter a valid website link' })
  @MaxLength(300)
  website?: string;

  @IsIn(INQUIRY_CATEGORIES as unknown as string[], {
    message: 'Pick a category',
  })
  category!: string;

  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'Tell us a little more (at least 10 characters)' })
  @MaxLength(2000)
  description!: string;
}

export class VerifyInquiryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AcceptInquiryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  leadId?: string;
}

export class RejectInquiryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@Injectable()
export class InquiriesService {
  private readonly col = new JsonCollection<Inquiry>(dataPath('inquiries'));

  list(): Inquiry[] {
    return [...this.col.all()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async create(dto: CreateInquiryDto): Promise<{ id: string }> {
    const item: Inquiry = {
      id: randomUUID(),
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? '',
      facebookUrl: dto.facebookUrl,
      website: dto.website ?? '',
      category: dto.category,
      description: dto.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await this.col.save([...this.col.all(), item]);
    return { id: item.id };
  }

  private get(id: string): Inquiry {
    const cur = this.col.find(id);
    if (!cur) throw new NotFoundException('Inquiry not found');
    return cur;
  }

  private async put(next: Inquiry): Promise<Inquiry> {
    await this.col.save(this.col.all().map((i) => (i.id === next.id ? next : i)));
    return next;
  }

  /** Step 1 — the admin phoned the customer and confirmed the request is real. */
  async verify(id: string, note?: string): Promise<Inquiry> {
    const cur = this.get(id);
    if (cur.status !== 'pending')
      throw new BadRequestException('Only pending requests can be verified');
    return this.put({
      ...cur,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifyNote: note ?? '',
    });
  }

  /** Step 2 — only a phone-verified request can be accepted (and become a CRM lead). */
  async accept(id: string, leadId?: string): Promise<Inquiry> {
    const cur = this.get(id);
    if (cur.status !== 'verified')
      throw new BadRequestException(
        'Verify this request by phone call before accepting it',
      );
    return this.put({
      ...cur,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      leadId: leadId ?? '',
    });
  }

  async reject(id: string, reason?: string): Promise<Inquiry> {
    const cur = this.get(id);
    if (cur.status === 'accepted')
      throw new BadRequestException('An accepted request cannot be rejected');
    return this.put({
      ...cur,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectReason: reason ?? '',
    });
  }

  /** Put a verified or rejected request back to pending. */
  async reopen(id: string): Promise<Inquiry> {
    const cur = this.get(id);
    if (cur.status === 'accepted' || cur.status === 'pending')
      throw new BadRequestException('This request cannot be reopened');
    return this.put({
      ...cur,
      status: 'pending',
      verifiedAt: undefined,
      verifyNote: undefined,
      rejectedAt: undefined,
      rejectReason: undefined,
    });
  }

  async remove(id: string): Promise<void> {
    if (!this.col.find(id)) throw new NotFoundException('Inquiry not found');
    await this.col.save(this.col.all().filter((i) => i.id !== id));
  }
}

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly service: InquiriesService) {}

  /** Public: the website contact form posts here. */
  @Post()
  create(@Body() dto: CreateInquiryDto) {
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyInquiryDto) {
    return this.service.verify(id, dto.note);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Body() dto: AcceptInquiryDto) {
    return this.service.accept(id, dto.leadId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectInquiryDto) {
    return this.service.reject(id, dto.reason);
  }

  @Patch(':id/reopen')
  reopen(@Param('id') id: string) {
    return this.service.reopen(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}

@Module({
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
