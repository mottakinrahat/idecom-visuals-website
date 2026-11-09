import { IsIn } from 'class-validator';
import { BOOKING_STATUSES } from '../entities/booking.entity';
import type { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsIn(BOOKING_STATUSES as unknown as string[])
  status!: BookingStatus;
}

