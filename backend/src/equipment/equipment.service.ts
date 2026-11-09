import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import {
  BLOCKING_STATUSES,
  BOOKING_TRANSITIONS,
  Booking,
  BookingStatus,
} from './entities/booking.entity';
import { Availability, Equipment } from './entities/equipment.entity';
import { calculateEndTime, calculateRentalPrice } from './rental-pricing';
import { DataStore } from './store/data-store';

export type EquipmentView = Equipment & {
  availability: Availability;
  /** Booking that currently holds the item (active, or confirmed & in its time window). */
  currentBooking: Booking | null;
  /** Next future booking, if any. */
  nextBooking: Booking | null;
  upcomingBookings: number;
};

@Injectable()
export class EquipmentService {
  constructor(private readonly store: DataStore) {}

  /* ---------------- equipment ---------------- */

  list(filter: { q?: string; availability?: string } = {}): EquipmentView[] {
    const q = filter.q?.trim().toLowerCase();
    return this.store.equipment
      .all()
      .map((e) => this.toView(e))
      .filter((e) => {
        if (q && !`${e.name} ${e.description}`.toLowerCase().includes(q)) return false;
        if (filter.availability && e.availability !== filter.availability) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): EquipmentView {
    return this.toView(this.mustFind(id));
  }

  async create(dto: CreateEquipmentDto): Promise<EquipmentView> {
    this.assertUniqueName(dto.name);
    const now = new Date().toISOString();
    const item: Equipment = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? '',
      imageUrl: dto.imageUrl ?? '',
      pricePerHour: dto.pricePerHour,
      status: dto.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    };
    await this.store.equipment.save([item, ...this.store.equipment.all()]);
    return this.toView(item);
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<EquipmentView> {
    const current = this.mustFind(id);
    if (dto.name && dto.name !== current.name) this.assertUniqueName(dto.name, id);
    const next: Equipment = {
      ...current,
      ...Object.fromEntries(
        Object.entries(dto).filter(([, v]) => v !== undefined),
      ),
      updatedAt: new Date().toISOString(),
    };
    await this.store.equipment.save(
      this.store.equipment.all().map((e) => (e.id === id ? next : e)),
    );
    return this.toView(next);
  }

  async remove(id: string): Promise<void> {
    this.mustFind(id);
    const hasOpen = this.store.bookings
      .all()
      .some((b) => b.equipmentId === id && BLOCKING_STATUSES.includes(b.status));
    if (hasOpen) {
      throw new ConflictException(
        'Cannot delete equipment with open bookings. Cancel or complete them first.',
      );
    }
    await this.store.equipment.save(
      this.store.equipment.all().filter((e) => e.id !== id),
    );
    await this.store.bookings.save(
      this.store.bookings.all().filter((b) => b.equipmentId !== id),
    );
  }

  /** Price quote — hourly base rate, proportional for any duration. */
  quote(id: string, minutes: number) {
    const item = this.mustFind(id);
    return {
      equipmentId: id,
      pricePerHour: item.pricePerHour,
      durationMinutes: minutes,
      totalPrice: calculateRentalPrice(item.pricePerHour, minutes),
    };
  }

  /* ---------------- bookings ---------------- */

  listBookings(equipmentId?: string): (Booking & { equipmentName: string })[] {
    return this.store.bookings
      .all()
      .filter((b) => !equipmentId || b.equipmentId === equipmentId)
      .map((b) => ({
        ...b,
        equipmentName: this.store.equipment.find(b.equipmentId)?.name ?? 'Deleted item',
      }))
      .sort((a, b) => b.startAt.localeCompare(a.startAt));
  }

  async createBooking(equipmentId: string, dto: CreateBookingDto): Promise<Booking> {
    const item = this.mustFind(equipmentId);
    if (item.status === 'maintenance') {
      throw new ConflictException('This equipment is under maintenance and cannot be booked.');
    }

    const start = new Date(dto.startAt);
    // allow a small grace window so "start now" is not rejected by clock drift
    if (start.getTime() < Date.now() - 5 * 60_000) {
      throw new BadRequestException('Start time cannot be in the past.');
    }

    const endAt = calculateEndTime(dto.startAt, dto.durationMinutes);
    const clash = this.store.bookings.all().find(
      (b) =>
        b.equipmentId === equipmentId &&
        BLOCKING_STATUSES.includes(b.status) &&
        b.startAt < endAt &&
        dto.startAt < b.endAt,
    );
    if (clash) {
      throw new ConflictException(
        `Already booked from ${clash.startAt} to ${clash.endAt}. Pick a different time.`,
      );
    }

    const now = new Date().toISOString();
    const booking: Booking = {
      id: randomUUID(),
      equipmentId,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      note: dto.note ?? '',
      startAt: new Date(dto.startAt).toISOString(),
      endAt,
      durationMinutes: dto.durationMinutes,
      pricePerHour: item.pricePerHour,
      totalPrice: calculateRentalPrice(item.pricePerHour, dto.durationMinutes),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await this.store.bookings.save([booking, ...this.store.bookings.all()]);
    return booking;
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const current = this.store.bookings.find(id);
    if (!current) throw new NotFoundException('Booking not found');
    if (!BOOKING_TRANSITIONS[current.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change a ${current.status} booking to ${status}.`,
      );
    }
    const next: Booking = { ...current, status, updatedAt: new Date().toISOString() };
    await this.store.bookings.save(
      this.store.bookings.all().map((b) => (b.id === id ? next : b)),
    );
    return next;
  }

  /* ---------------- helpers ---------------- */

  private mustFind(id: string): Equipment {
    const item = this.store.equipment.find(id);
    if (!item) throw new NotFoundException('Equipment not found');
    return item;
  }

  private assertUniqueName(name: string, ignoreId?: string) {
    const taken = this.store.equipment
      .all()
      .some((e) => e.id !== ignoreId && e.name.toLowerCase() === name.toLowerCase());
    if (taken) throw new ConflictException('Equipment with this name already exists.');
  }

  private toView(e: Equipment): EquipmentView {
    const nowIso = new Date().toISOString();
    const open = this.store.bookings
      .all()
      .filter((b) => b.equipmentId === e.id && BLOCKING_STATUSES.includes(b.status))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

    const currentBooking =
      open.find(
        (b) => b.status === 'active' || (b.status === 'confirmed' && b.startAt <= nowIso && nowIso < b.endAt),
      ) ?? null;
    const future = open.filter((b) => b.startAt > nowIso && b !== currentBooking);

    const availability: Availability =
      e.status === 'maintenance' ? 'maintenance' : currentBooking ? 'rented' : 'available';

    return {
      ...e,
      availability,
      currentBooking,
      nextBooking: future[0] ?? null,
      upcomingBookings: future.length,
    };
  }
}

