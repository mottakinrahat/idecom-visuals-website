import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { DbService } from '../../db/db.service';
import { PgCollection, TableSpec } from '../../db/pg-collection';
import type { Booking } from '../entities/booking.entity';
import type { Equipment } from '../entities/equipment.entity';

/** Where the old JSON files lived — they are imported into PostgreSQL once on first start. */
export const dataPath = (name: string) =>
  join(process.cwd(), 'data', `${name}.json`);

export const EQUIPMENT_SPEC: TableSpec<Equipment> = {
  id: 'text',
  name: 'text',
  description: 'text',
  imageUrl: 'text',
  pricePerHour: 'num',
  status: 'text',
  createdAt: 'ts',
  updatedAt: 'ts',
};

export const BOOKING_SPEC: TableSpec<Booking> = {
  id: 'text',
  equipmentId: 'text',
  customerName: 'text',
  customerPhone: 'text',
  note: 'text',
  startAt: 'ts',
  endAt: 'ts',
  durationMinutes: 'int',
  pricePerHour: 'num',
  totalPrice: 'num',
  status: 'text',
  createdAt: 'ts',
  updatedAt: 'ts',
};

@Injectable()
export class DataStore implements OnModuleInit {
  readonly equipment: PgCollection<Equipment>;
  readonly bookings: PgCollection<Booking>;

  constructor(db: DbService) {
    this.equipment = new PgCollection<Equipment>(db.pool, 'equipment', EQUIPMENT_SPEC, {
      legacyFile: dataPath('equipment'),
    });
    this.bookings = new PgCollection<Booking>(db.pool, 'bookings', BOOKING_SPEC, {
      legacyFile: dataPath('bookings'),
    });
  }

  async onModuleInit() {
    await Promise.all([this.equipment.ready, this.bookings.ready]);
  }
}
