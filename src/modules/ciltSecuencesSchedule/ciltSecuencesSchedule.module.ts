import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSecuencesScheduleController } from './ciltSecuencesSchedule.controller';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltMstrModule } from '../ciltMstr/ciltMstr.module';
import { CiltSequencesModule } from '../ciltSequences/ciltSequences.module';
import { SiteModule } from '../site/site.module';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSecuencesScheduleEntity,
      CiltMstrEntity,
      CiltSequencesEntity,
      SiteEntity
    ]),
    forwardRef(() => CiltMstrModule),
    CiltSequencesModule,
    SiteModule
  ],
  controllers: [CiltSecuencesScheduleController],
  providers: [CiltSecuencesScheduleService, CustomLoggerService],
  exports: [CiltSecuencesScheduleService]
})
export class CiltSecuencesScheduleModule {} 