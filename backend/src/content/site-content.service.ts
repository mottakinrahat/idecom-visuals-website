import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { DbService } from '../db/db.service';
import { KvService } from '../db/kv.service';

type Obj = Record<string, unknown>;

/** Section headings (eyebrow / title / em / sub) of the sections that have their own tables. */
const SECTIONS = ['clients', 'services', 'videos', 'team', 'contact'] as const;
type SectionKey = (typeof SECTIONS)[number];

const BRAND_STYLES: [code: string, label: string][] = [
  ['b1', 'Bold Display'],
  ['b2', 'Minimal Sans'],
  ['b3', 'Condensed'],
  ['b4', 'Mono Spaced'],
  ['b5', 'Heavy Sans'],
];

const SCHEMA = `
create table if not exists site_sections (
  key     text primary key check (key in ('clients','services','videos','team','contact')),
  eyebrow text not null default '',
  title   text not null default '',
  em      text not null default '',
  sub     text not null default ''
);

create table if not exists brand_styles (
  code     text primary key,
  label    text not null,
  position integer not null
);

create table if not exists client_brands (
  id       serial primary key,
  position integer not null,
  name     text not null,
  style    text not null references brand_styles(code) on update cascade
);

create table if not exists client_stats (
  id       serial primary key,
  position integer not null,
  number   text not null,
  label    text not null
);

create table if not exists services (
  id          text primary key,
  position    integer not null,
  title       text not null,
  highlighted boolean not null default false
);

create table if not exists service_items (
  id         serial primary key,
  service_id text not null references services(id) on delete cascade,
  position   integer not null,
  label      text not null
);
create index if not exists service_items_service_idx on service_items(service_id, position);

create table if not exists team_members (
  id        text primary key,
  position  integer not null,
  name      text not null,
  role      text not null,
  photo_url text not null default ''
);

create table if not exists site_contact (
  id        smallint primary key default 1 check (id = 1),
  email     text not null default '',
  phone     text not null default '',
  location  text not null default '',
  footer_bio text not null default ''
);
`;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v: unknown, max = 200): Obj[] => (Array.isArray(v) ? v.filter(isObj).slice(0, max) : []);

/**
 * The CMS website content. Each repeating thing is its own table (brands, stats, services → service_items,
 * team members, contact details, section headings); only the hero + settings document stays in `kv_store`.
 * The dashboard still reads/writes one `SiteContent` object, which is split into / assembled from the tables here.
 *
 * WhatsApp number and social links are NOT stored here — they live once, in `settings.socialLinks` (kv document).
 */
@Injectable()
export class SiteContentService implements OnModuleInit {
  private readonly logger = new Logger(SiteContentService.name);

  constructor(
    private readonly db: DbService,
    private readonly kv: KvService,
  ) {}

  async onModuleInit() {
    await this.kv.onModuleInit(); // idempotent; guarantees kv_store exists whatever the hook order
    await this.db.pool.query(SCHEMA);
    for (const [i, [code, label]] of BRAND_STYLES.entries()) {
      await this.db.pool.query(
        'insert into brand_styles (code, label, position) values ($1, $2, $3) on conflict (code) do update set label = excluded.label, position = excluded.position',
        [code, label, i],
      );
    }

    // one-time move of the old single-JSON document into the tables
    const { rowCount } = await this.db.pool.query('select 1 from site_sections limit 1');
    if (!rowCount) {
      const legacy = await this.kv.get<Obj>('site');
      if (isObj(legacy) && SECTIONS.some((k) => isObj(legacy[k]))) {
        await this.save(legacy);
        this.logger.log('Moved the CMS document from kv_store into relational tables');
      }
    }
  }

  /** `null` until something was saved, so the website falls back to its built-in defaults. */
  async load(): Promise<Obj | null> {
    const q = <T = Obj>(sql: string) => this.db.pool.query(sql).then((r) => r.rows as T[]);
    const [rest, sections, brands, stats, services, items, team, contact] = await Promise.all([
      this.kv.get<Obj>('site'),
      q('select * from site_sections'),
      q('select name, style from client_brands order by position, id'),
      q('select number, label from client_stats order by position, id'),
      q('select id, title, highlighted from services order by position, id'),
      q('select service_id, label from service_items order by position, id'),
      q('select id, name, role, photo_url from team_members order by position, id'),
      q('select * from site_contact where id = 1'),
    ]);

    if (!sections.length && !rest) return null;

    const out: Obj = isObj(rest) ? { ...rest } : {};
    const head = (key: SectionKey) => {
      const s = sections.find((r) => r.key === key);
      return s ? { eyebrow: s.eyebrow, title: s.title, em: s.em, sub: s.sub } : null;
    };

    const clients = head('clients');
    if (clients) {
      out.clients = { eyebrow: clients.eyebrow, title: clients.title, em: clients.em, brands, stats };
    }
    const svc = head('services');
    if (svc) {
      out.services = {
        eyebrow: svc.eyebrow,
        title: svc.title,
        em: svc.em,
        sub: svc.sub,
        list: services.map((s) => ({
          id: s.id,
          title: s.title,
          hl: s.highlighted,
          items: items.filter((i) => i.service_id === s.id).map((i) => i.label),
        })),
      };
    }
    const videos = head('videos');
    if (videos) {
      // the videos themselves live in `portfolio_videos`; only legacy browser-imported cards may remain in the kv document
      const legacy = isObj(out.videos) ? out.videos : {};
      out.videos = { eyebrow: videos.eyebrow, title: videos.title, em: videos.em, landscape: legacy.landscape ?? [], vertical: legacy.vertical ?? [] };
    }
    const tm = head('team');
    if (tm) {
      out.team = {
        eyebrow: tm.eyebrow,
        title: tm.title,
        em: tm.em,
        members: team.map((m) => ({ id: m.id, name: m.name, role: m.role, photoUrl: m.photo_url })),
      };
    }
    const ct = head('contact');
    if (ct) {
      const c = contact[0] ?? {};
      out.contact = {
        eyebrow: ct.eyebrow,
        title: ct.title,
        em: ct.em,
        sub: ct.sub,
        email: c.email ?? '',
        phone: c.phone ?? '',
        location: c.location ?? '',
        footerBio: c.footer_bio ?? '',
      };
    }
    return out;
  }

  /** Replace the stored content with this document (one transaction — all or nothing). */
  async save(data: Obj): Promise<void> {
    if (!isObj(data)) throw new BadRequestException('data must be an object');
    const client = await this.db.pool.connect();
    try {
      await client.query('begin');
      const rest: Obj = {};
      for (const [k, v] of Object.entries(data)) {
        if (k === 'hero' || k === 'settings') rest[k] = v;
      }

      for (const key of SECTIONS) {
        const s = data[key];
        if (isObj(s)) await this.saveHeading(client, key, s);
      }
      if (isObj(data.clients)) await this.saveClients(client, data.clients);
      if (isObj(data.services)) await this.saveServices(client, list(data.services.list));
      if (isObj(data.team)) await this.saveTeam(client, list(data.team.members, 100));
      if (isObj(data.contact)) await this.saveContact(client, data.contact);

      // legacy browser-imported video cards stay in the kv document until the dashboard has moved them to `portfolio_videos`
      if (isObj(data.videos)) rest.videos = { landscape: list(data.videos.landscape, 100), vertical: list(data.videos.vertical, 100) };

      await client.query(
        `insert into kv_store (key, data, updated_at) values ('site', $1::jsonb, now())
         on conflict (key) do update set data = excluded.data, updated_at = now()`,
        [JSON.stringify(rest)],
      );
      await client.query('commit');
    } catch (err) {
      await client.query('rollback').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  private saveHeading(c: PoolClient, key: SectionKey, s: Obj) {
    return c.query(
      `insert into site_sections (key, eyebrow, title, em, sub) values ($1, $2, $3, $4, $5)
       on conflict (key) do update set eyebrow = excluded.eyebrow, title = excluded.title, em = excluded.em, sub = excluded.sub`,
      [key, str(s.eyebrow, 200), str(s.title, 300), str(s.em, 300), str(s.sub, 1000)],
    );
  }

  private async saveClients(c: PoolClient, s: Obj) {
    const styles = new Set(BRAND_STYLES.map(([code]) => code));
    await c.query('delete from client_brands');
    await c.query('delete from client_stats');
    for (const [i, b] of list(s.brands).entries()) {
      const style = str(b.style, 10);
      await c.query('insert into client_brands (position, name, style) values ($1, $2, $3)', [i, str(b.name, 120), styles.has(style) ? style : 'b1']);
    }
    for (const [i, st] of list(s.stats, 20).entries()) {
      await c.query('insert into client_stats (position, number, label) values ($1, $2, $3)', [i, str(st.number, 40), str(st.label, 120)]);
    }
  }

  private async saveServices(c: PoolClient, services: Obj[]) {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const [i, s] of services.entries()) {
      let id = str(s.id, 64).trim() || randomUUID();
      if (seen.has(id)) id = randomUUID();
      seen.add(id);
      ids.push(id);
      await c.query(
        `insert into services (id, position, title, highlighted) values ($1, $2, $3, $4)
         on conflict (id) do update set position = excluded.position, title = excluded.title, highlighted = excluded.highlighted`,
        [id, i, str(s.title, 200), s.hl === true],
      );
      await c.query('delete from service_items where service_id = $1', [id]);
      const labels = Array.isArray(s.items) ? s.items.filter((x): x is string => typeof x === 'string').slice(0, 100) : [];
      for (const [j, label] of labels.entries()) {
        await c.query('insert into service_items (service_id, position, label) values ($1, $2, $3)', [id, j, label.slice(0, 300)]);
      }
    }
    await c.query('delete from services where id <> all($1::text[])', [ids]); // items go with them (on delete cascade)
  }

  private async saveTeam(c: PoolClient, members: Obj[]) {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const [i, m] of members.entries()) {
      let id = str(m.id, 64).trim() || randomUUID();
      if (seen.has(id)) id = randomUUID();
      seen.add(id);
      ids.push(id);
      await c.query(
        `insert into team_members (id, position, name, role, photo_url) values ($1, $2, $3, $4, $5)
         on conflict (id) do update set position = excluded.position, name = excluded.name, role = excluded.role, photo_url = excluded.photo_url`,
        [id, i, str(m.name, 120), str(m.role, 160), str(m.photoUrl, 2_000_000)],
      );
    }
    await c.query('delete from team_members where id <> all($1::text[])', [ids]);
  }

  private saveContact(c: PoolClient, s: Obj) {
    return c.query(
      `insert into site_contact (id, email, phone, location, footer_bio) values (1, $1, $2, $3, $4)
       on conflict (id) do update set email = excluded.email, phone = excluded.phone, location = excluded.location, footer_bio = excluded.footer_bio`,
      [str(s.email, 160), str(s.phone, 60), str(s.location, 200), str(s.footerBio, 2000)],
    );
  }
}
