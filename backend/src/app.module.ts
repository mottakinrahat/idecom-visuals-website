import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContentModule } from './content/content.module';
import { CrmModule } from './crm/crm.module';
import { CustomPackagesModule } from './custom-packages/custom-packages.module';
import { DbModule } from './db/db.module';
import { EquipmentModule } from './equipment/equipment.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { PackagesModule } from './packages/packages.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // loads backend/.env in development
    DbModule,
    EquipmentModule,
    PackagesModule,
    InquiriesModule,
    PortfolioModule,
    CrmModule,
    CustomPackagesModule,
    ContentModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
