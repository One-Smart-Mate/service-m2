import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { OplDetailsService } from './oplDetails.service';
import { OplDetailsController } from './oplDetails.controller';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { OplDetailPersistence } from './opl-detail.persistence';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OplDetailsEntity,
      OplMstr,
      SiteEntity
    ])
  ],
  controllers: [OplDetailsController],
  providers: [OplDetailsService, OplDetailPersistence],
  exports: [OplDetailsService],
})
export class OplDetailsModule {}
