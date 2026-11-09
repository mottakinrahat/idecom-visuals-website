import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EQUIPMENT_STATUSES } from '../entities/equipment.entity';
import type { EquipmentStatus } from '../entities/equipment.entity';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Equipment fields & validation rules
 * - name:         required, 2–80 chars
 * - description:  optional, up to 1000 chars
 * - imageUrl:     optional, an uploaded path (/uploads/…) or http(s) URL
 * - pricePerHour: required, > 0, ≤ 1,000,000 BDT, max 2 decimals (base hourly rate)
 * - status:       "active" | "maintenance" (default "active")
 */
export class CreateEquipmentDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(80, { message: 'Name must be at most 80 characters' })
  name!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000, { message: 'Description must be at most 1000 characters' })
  description?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price per hour must be a number with at most 2 decimals' },
  )
  @Min(0.01, { message: 'Price per hour must be greater than 0' })
  @Max(1_000_000, { message: 'Price per hour is too large' })
  pricePerHour!: number;

  @IsOptional()
  @IsIn(EQUIPMENT_STATUSES as unknown as string[])
  status?: EquipmentStatus;
}

