import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { QuoteQueryDto } from './dto/quote-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentService } from './equipment.service';

@Controller()
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  /* ----- equipment ----- */

  @Get('equipment')
  list(@Query('q') q?: string, @Query('availability') availability?: string) {
    return this.service.list({ q, availability });
  }

  @Post('equipment')
  create(@Body() dto: CreateEquipmentDto) {
    return this.service.create(dto);
  }

  @Get('equipment/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Patch('equipment/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentDto) {
    return this.service.update(id, dto);
  }

  @Delete('equipment/:id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }

  /** e.g. GET /api/equipment/:id/quote?minutes=20 → totalPrice for 20 minutes */
  @Get('equipment/:id/quote')
  quote(@Param('id', ParseUUIDPipe) id: string, @Query() query: QuoteQueryDto) {
    return this.service.quote(id, query.minutes);
  }

  /* ----- bookings ----- */

  @Get('bookings')
  bookings(@Query('equipmentId') equipmentId?: string) {
    return this.service.listBookings(equipmentId);
  }

  @Post('equipment/:id/bookings')
  book(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateBookingDto) {
    return this.service.createBooking(id, dto);
  }

  @Patch('bookings/:id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.service.updateBookingStatus(id, dto.status);
  }
}

