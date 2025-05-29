import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSecuencesScheduleController } from './ciltSecuencesSchedule.controller';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { SiteEntity } from '../site/entities/site.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSecuencesScheduleEntity,
      CiltMstrEntity,
      CiltSequencesEntity,
      SiteEntity
    ])
  ],
  controllers: [CiltSecuencesScheduleController],
  providers: [CiltSecuencesScheduleService],
  exports: [CiltSecuencesScheduleService],
})
export class CiltSecuencesScheduleModule {} 