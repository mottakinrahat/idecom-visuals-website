import { Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { Pool } from 'pg';

/** Column types. Every field of the entity must be listed in the table spec. */
export type ColType = 'text' | 'int' | 'num' | 'bool' | 'ts' | 'json';
export type TableSpec<T> = { [K in keyof T]-?: ColType };

const SQL_TYPE: Record<ColType, string> = {
  text: 'text',
  int: 'integer',
  num: 'double precision',
  bool: 'boolean',
  ts: 'timestamptz',
  json: 'jsonb',
};

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`;

/**
 * A PostgreSQL table with the same small interface the services already use
 * (all / find / save), so business logic stays unchanged.
 *
 *  - Real columns (one per field), created automatically — no manual migration step.
 *  - Rows are cached in memory after startup (single backend instance); every write goes to
 *    PostgreSQL inside a transaction and the cache is rolled back if the write fails.
 *  - First start only: if the table is empty and an old JSON file exists, it is imported once;
 *    otherwise optional seed rows are inserted once (never again, even if the owner deletes everything).
 */
export class PgCollection<T extends { id: string }> {
  private items: T[] = [];
  private queue: Promise<void> = Promise.resolve();
  private readonly logger: Logger;
  private readonly fields: (keyof T & string)[];
  /** Resolves once the table exists and the cache is loaded. Await it in onModuleInit. */
  readonly ready: Promise<void>;

  constructor(
    private readonly pool: Pool,
    private readonly table: string,
    private readonly spec: TableSpec<T>,
    opts: { legacyFile?: string; seed?: T[] } = {},
  ) {
    this.logger = new Logger(`PgCollection:${table}`);
    this.fields = Object.keys(spec) as (keyof T & string)[];
    this.ready = this.init(opts);
  }

  all(): T[] {
    return this.items;
  }

  find(id: string): T | undefined {
    return this.items.find((i) => i.id === id);
  }

  /** Replace the whole collection: inserts/updates changed rows and deletes removed ones. */
  async save(next: T[]): Promise<void> {
    const prev = this.items;
    this.items = next;
    const run = this.queue.then(() => this.write(prev, next));
    this.queue = run.catch(() => undefined);
    try {
      await run;
    } catch (err) {
      this.items = prev; // keep memory identical to the database
      this.logger.error(`Write failed, rolled back: ${(err as Error).message}`);
      throw err;
    }
  }

  /* ------------------------------------------------------------------ */

  private async init(opts: { legacyFile?: string; seed?: T[] }) {
    const cols = this.fields.map((f) => (f === 'id' ? `${q('id')} text primary key` : `${q(snake(f))} ${SQL_TYPE[this.spec[f]]}`));
    await this.pool.query(`create table if not exists ${q(this.table)} (${cols.join(', ')})`);
    // add columns introduced later, so new fields never need a manual migration
    for (const f of this.fields) {
      if (f === 'id') continue;
      await this.pool.query(`alter table ${q(this.table)} add column if not exists ${q(snake(f))} ${SQL_TYPE[this.spec[f]]}`);
    }
    await this.pool.query('create table if not exists _seeded (name text primary key, at timestamptz default now())');

    const rows = await this.pool.query(`select * from ${q(this.table)}`);
    this.items = rows.rows.map((r) => this.fromRow(r));

    if (this.items.length === 0) {
      const done = await this.pool.query('select 1 from _seeded where name = $1', [this.table]);
      if (done.rowCount === 0) {
        let initial: T[] = [];
        if (opts.legacyFile && existsSync(opts.legacyFile)) {
          try {
            initial = JSON.parse(readFileSync(opts.legacyFile, 'utf8')) as T[];
            this.logger.log(`Importing ${initial.length} row(s) from ${opts.legacyFile}`);
          } catch (err) {
            this.logger.error(`Could not read ${opts.legacyFile}: ${(err as Error).message}`);
          }
        } else if (opts.seed) {
          initial = opts.seed;
        }
        if (initial.length) await this.save(initial);
        await this.pool.query('insert into _seeded (name) values ($1) on conflict do nothing', [this.table]);
      }
    }
    this.logger.log(`${this.table}: ${this.items.length} row(s)`);
  }

  private async write(prev: T[], next: T[]) {
    const before = new Map(prev.map((r) => [r.id, JSON.stringify(r)]));
    const nextIds = new Set(next.map((r) => r.id));
    const changed = next.filter((r) => before.get(r.id) !== JSON.stringify(r));
    const removed = prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id);
    if (!changed.length && !removed.length) return;

    const client = await this.pool.connect();
    try {
      await client.query('begin');
      if (removed.length) await client.query(`delete from ${q(this.table)} where id = any($1::text[])`, [removed]);
      const colNames = this.fields.map((f) => q(snake(f)));
      const placeholders = this.fields.map((f, i) => (this.spec[f] === 'json' ? `$${i + 1}::jsonb` : `$${i + 1}`));
      const updates = this.fields.filter((f) => f !== 'id').map((f) => `${q(snake(f))} = excluded.${q(snake(f))}`);
      const sql =
        `insert into ${q(this.table)} (${colNames.join(', ')}) values (${placeholders.join(', ')}) ` +
        `on conflict (id) do update set ${updates.join(', ')}`;
      for (const r of changed) await client.query(sql, this.fields.map((f) => this.toParam(f, r[f])));
      await client.query('commit');
    } catch (err) {
      await client.query('rollback').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  private toParam(field: keyof T & string, v: unknown) {
    if (v === undefined || v === null || v === '' && this.spec[field] === 'ts') return null;
    if (this.spec[field] === 'json') return JSON.stringify(v);
    return v;
  }

  private fromRow(row: Record<string, unknown>): T {
    const out: Record<string, unknown> = {};
    for (const f of this.fields) {
      const v = row[snake(f)];
      if (v === null || v === undefined) continue; // optional field not set
      out[f] = this.spec[f] === 'ts' ? (v instanceof Date ? v.toISOString() : v) : v;
    }
    return out as T;
  }
}
