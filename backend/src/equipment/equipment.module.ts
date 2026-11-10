import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { DataStore } from './store/data-store';

@Module({
  controllers: [EquipmentController],
  providers: [EquipmentService, DataStore],
})
export class EquipmentModule {}

