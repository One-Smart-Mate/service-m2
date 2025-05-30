import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { OplDetailsService } from './oplDetails.service';
import { OplDetailsController } from './oplDetails.controller';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { SiteEntity } from '../site/entities/site.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OplDetailsEntity,
      OplMstr,
      SiteEntity
    ])
  ],
  controllers: [OplDetailsController],
  providers: [OplDetailsService],
  exports: [OplDetailsService],
})
export class OplDetailsModule {} 