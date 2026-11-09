import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentDto } from './create-equipment.dto';

/** Every field optional; the same validation rules apply to what is sent. */
export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}

