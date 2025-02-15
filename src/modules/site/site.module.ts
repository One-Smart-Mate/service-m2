import { Module } from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteEntity } from './entities/site.entity';
import { SitePositionsEntity } from './entities/site.positions.entity'; 
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    CompanyModule, 
    TypeOrmModule.forFeature([SiteEntity, SitePositionsEntity])],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService]
})
export class SiteModule {}
