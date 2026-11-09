import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { DataStore } from './store/data-store';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [EquipmentController, UploadsController],
  providers: [EquipmentService, DataStore],
})
export class EquipmentModule {}

