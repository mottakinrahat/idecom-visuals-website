import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/** One shared PostgreSQL connection pool (Neon), configured by DATABASE_URL. */
@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  readonly pool: Pool;

  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL')?.trim();
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Add your PostgreSQL (Neon) connection string to backend/.env — all data is stored in that database.',
      );
    }
    this.pool = new Pool({ connectionString: url, max: 8, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 });
    // a dropped idle connection must not crash the process
    this.pool.on('error', (err) => this.logger.error(`Idle PostgreSQL client error: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
