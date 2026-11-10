import {
  BadRequestException,
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
import { DbService } from '../db/db.service';
import { PgCollection, TableSpec } from '../db/pg-collection';
import { dataPath } from '../equipment/store/data-store';

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

const VALID_FB_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'business.facebook.com',
  'fb.com',
  'www.fb.com',
  'fb.me',
  'www.fb.me',
  'fb.watch',
]);

const FB_PLACEHOLDERS = new Set([
  'yourpage',
  'your-page',
  'your_page',
  'yourbrand',
  'example',
  'testpage',
]);

const FB_SYSTEM_ROUTES = new Set([
  'login',
  'login.php',
  'reg',
  'recover',
  'checkpoint',
  'help',
  'settings',
  'privacy',
  'policies',
  'terms',
  'watch',
  'marketplace',
  'gaming',
  'bookmarks',
  'notifications',
  'messages',
  'events',
  'friends',
  'home.php',
  'hashtag',
  'search',
]);

function checkFacebookUrlSyntax(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'Enter a valid Facebook page link';
  }
  if (
    !/^https?:$/i.test(url.protocol) ||
    !VALID_FB_HOSTS.has(url.hostname.toLowerCase())
  ) {
    return 'Must be a valid Facebook page link (e.g. facebook.com/yourbrand)';
  }
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return 'Include your Facebook page username or path (e.g. facebook.com/yourbrand)';
  }
  const first = segments[0].toLowerCase();
  if (FB_PLACEHOLDERS.has(first)) {
    return 'Please enter your actual Facebook page link';
  }
  if (FB_SYSTEM_ROUTES.has(first)) {
    return 'Enter a Facebook page or profile link, not a Facebook system page';
  }
  if (first === 'profile.php') {
    const id = url.searchParams.get('id') ?? '';
    if (!/^\d{4,}$/.test(id)) {
      return 'profile.php link must include a valid numeric ID';
    }
    return null;
  }
  if (['pages', 'people', 'p', 'share', 'groups'].includes(first)) {
    if (segments.length < 2 || segments[1].trim().length < 2) {
      return 'Enter the complete Facebook page link';
    }
    return null;
  }
  if (first.length < 3 && !/^\d+$/.test(first)) {
    return 'Facebook page username must be at least 3 characters';
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(first) || /^[.-]|[.-]$/.test(first)) {
    return 'Facebook page link contains invalid characters';
  }
  return null;
}

const FB_CRAWLER_UA =
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const INVALID_FB_TITLES =
  /^(facebook|log in or sign up to view|log into facebook|content not found|page not found|error|sorry, something went wrong)$/i;

async function verifyFacebookUrlReachable(raw: string): Promise<string | null> {
  const syntaxErr = checkFacebookUrlSyntax(raw);
  if (syntaxErr) return syntaxErr;

  let cur = new URL(raw);
  if (cur.protocol === 'http:') cur.protocol = 'https:';

  for (let i = 0; i < 6; i++) {
    if (
      cur.protocol !== 'https:' ||
      !VALID_FB_HOSTS.has(cur.hostname.toLowerCase())
    ) {
      return 'Must be a valid Facebook page link';
    }
    let res: Response;
    try {
      res = await fetch(cur, {
        redirect: 'manual',
        headers: { 'user-agent': FB_CRAWLER_UA },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return null;
    }
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      cur = new URL(loc, cur);
      if (cur.protocol === 'http:') cur.protocol = 'https:';
      continue;
    }
    break;
  }

  const cleanPath = cur.pathname.replace(/\/+$/, '');
  if (
    !cleanPath ||
    /^\/(login(\.php)?|checkpoint|recover|help|r\.php|reg)$/i.test(cleanPath)
  ) {
    return 'This Facebook page could not be found. Please check the link.';
  }

  try {
    const res = await fetch(cur, {
      headers: {
        'user-agent': FB_CRAWLER_UA,
        'accept-language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404 || res.status === 410) {
      return 'This Facebook page does not exist. Please check the link.';
    }
    const html = await res.text();
    const ogTitle =
      html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      )?.[1] ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      )?.[1];
    const ogUrl =
      html.match(
        /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
      )?.[1] ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
      )?.[1];

    if (!ogTitle && !ogUrl) {
      return 'This Facebook page could not be found or is not public.';
    }
    if (ogTitle && INVALID_FB_TITLES.test(ogTitle.trim()) && !ogUrl) {
      return 'This Facebook page could not be found or is not public.';
    }
  } catch {
    // Allow submission if network check times out
  }
  return null;
}

export class CreateInquiryDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(80, { message: 'Name must be 80 characters or less' })
  @Matches(/^[\p{L}\s.'-]+$/u, {
    message: 'Enter a valid name (letters only)',
  })
  name!: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const v = value.trim().replace(/[\s-]/g, '');
    if (v.startsWith('+880')) return v.slice(3);
    if (v.startsWith('880')) return v.slice(2);
    if (v.startsWith('+88')) return v.slice(3);
    return v;
  })
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message:
      'Enter a valid Bangladesh phone number (e.g. 01712345678 or +8801712345678)',
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

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
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

const INQUIRY_SPEC: TableSpec<Inquiry> = {
  id: 'text',
  name: 'text',
  phone: 'text',
  email: 'text',
  facebookUrl: 'text',
  website: 'text',
  category: 'text',
  description: 'text',
  status: 'text',
  createdAt: 'ts',
  verifiedAt: 'ts',
  verifyNote: 'text',
  acceptedAt: 'ts',
  leadId: 'text',
  rejectedAt: 'ts',
  rejectReason: 'text',
};

@Injectable()
export class InquiriesService implements OnModuleInit {
  private readonly col: PgCollection<Inquiry>;

  constructor(db: DbService) {
    this.col = new PgCollection<Inquiry>(db.pool, 'inquiries', INQUIRY_SPEC, {
      legacyFile: dataPath('inquiries'),
    });
  }

  async onModuleInit() {
    await this.col.ready;
  }

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
      description: dto.description ?? '',
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
