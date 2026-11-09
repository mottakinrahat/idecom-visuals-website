import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import {
  MAX_RENTAL_MINUTES,
  MIN_RENTAL_MINUTES,
} from '../rental-pricing';

export class QuoteQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(MIN_RENTAL_MINUTES)
  @Max(MAX_RENTAL_MINUTES)
  minutes!: number;
}

