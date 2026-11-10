import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { KvService } from './kv.service';

@Global()
@Module({
  providers: [DbService, KvService],
  exports: [DbService, KvService],
})
export class DbModule {}
