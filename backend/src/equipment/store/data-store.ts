import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { rename, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

/**
 * Tiny JSON-file collection. Keeps the project dependency-free (no database
 * needed to run), while the service talks only to this small interface so it
 * can later be swapped for TypeORM/Postgres without touching business logic.
 * Writes are serialised and atomic (write temp file → rename).
 */
export class JsonCollection<T extends { id: string }> {
  private items: T[] = [];
  private queue: Promise<void> = Promise.resolve();
  private readonly logger = new Logger(JsonCollection.name);

  constructor(private readonly file: string) {
    mkdirSync(dirname(file), { recursive: true });
    if (existsSync(file)) {
      try {
        this.items = JSON.parse(readFileSync(file, 'utf8')) as T[];
      } catch (err) {
        this.logger.error(`Could not read ${file}, starting empty`, err as Error);
      }
    }
  }

  all(): T[] {
    return this.items;
  }

  find(id: string): T | undefined {
    return this.items.find((i) => i.id === id);
  }

  async save(next: T[]): Promise<void> {
    this.items = next;
    const snapshot = JSON.stringify(next, null, 2);
    this.queue = this.queue.then(async () => {
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, snapshot, 'utf8');
      await rename(tmp, this.file);
    });
    await this.queue;
  }
}

export const dataPath = (name: string) =>
  join(process.cwd(), 'data', `${name}.json`);

@Injectable()
export class DataStore {
  equipment = new JsonCollection<import('../entities/equipment.entity').Equipment>(
    dataPath('equipment'),
  );
  bookings = new JsonCollection<import('../entities/booking.entity').Booking>(
    dataPath('bookings'),
  );
}

