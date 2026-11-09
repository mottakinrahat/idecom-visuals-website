import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EquipmentModule } from './equipment/equipment.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { PackagesModule } from './packages/packages.module';

@Module({
  imports: [EquipmentModule, PackagesModule, InquiriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
