import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from './db.service';

/** Small JSON documents (CMS site content, package page texts) — one row per key in table `kv_store`. */
@Injectable()
export class KvService implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    await this.db.pool.query(
      'create table if not exists kv_store (key text primary key, data jsonb not null, updated_at timestamptz not null default now())',
    );
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const r = await this.db.pool.query('select data from kv_store where key = $1', [key]);
    return r.rowCount ? (r.rows[0].data as T) : null;
  }

  async set(key: string, data: unknown): Promise<void> {
    await this.db.pool.query(
      `insert into kv_store (key, data, updated_at) values ($1, $2::jsonb, now())
       on conflict (key) do update set data = excluded.data, updated_at = now()`,
      [key, JSON.stringify(data)],
    );
  }

  async delete(key: string): Promise<void> {
    await this.db.pool.query('delete from kv_store where key = $1', [key]);
  }
}
