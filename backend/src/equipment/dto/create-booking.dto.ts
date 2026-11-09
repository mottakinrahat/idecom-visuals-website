import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  MAX_RENTAL_MINUTES,
  MIN_RENTAL_MINUTES,
} from '../rental-pricing';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Booking fields & validation rules
 * - customerName:    required, 2–80 chars
 * - customerPhone:   required, 7–20 chars (digits, +, spaces, dashes)
 * - startAt:         required ISO date-time (cannot be in the past)
 * - durationMinutes: required integer, 1 minute … 30 days. The total price is
 *                    ALWAYS calculated on the server from the hourly base rate.
 */
export class CreateBookingDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Customer name must be at least 2 characters' })
  @MaxLength(80)
  customerName!: string;

  @Transform(trim)
  @IsString()
  @Matches(/^[0-9+()\-\s]{7,20}$/, {
    message: 'Enter a valid phone number (7–20 digits)',
  })
  customerPhone!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsDateString({}, { message: 'Start time must be a valid date-time' })
  startAt!: string;

  @Type(() => Number)
  @IsInt({ message: 'Duration must be a whole number of minutes' })
  @Min(MIN_RENTAL_MINUTES, { message: 'Minimum rental is 1 minute' })
  @Max(MAX_RENTAL_MINUTES, { message: 'Maximum rental is 30 days' })
  durationMinutes!: number;
}

