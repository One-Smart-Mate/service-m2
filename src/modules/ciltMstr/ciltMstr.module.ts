import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltMstrController } from './ciltMstr.controller';
import { CiltMstrService } from './ciltMstr.service';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';  
import { CiltSecuencesScheduleService } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.service';
import { CiltSecuencesScheduleEntity } from '../ciltSecuencesSchedule/entities/ciltSecuencesSchedule.entity';
import { SiteModule } from '../site/site.module';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { CiltSecuencesScheduleModule } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.module';
import { LevelModule } from '../level/level.module';


@Module({   
  imports: [
    TypeOrmModule.forFeature([
      CiltMstrEntity,
      UserEntity,
      UsersPositionsEntity,
      CiltSequencesEntity,
      CiltSequencesExecutionsEntity,
      CiltSecuencesScheduleEntity,
      SiteEntity,
      CiltMstrPositionLevelsEntity,
      OplMstr
    ]),
    SiteModule,
    forwardRef(() => CiltSecuencesScheduleModule),
    LevelModule
  ],
  controllers: [CiltMstrController],
  providers: [CiltMstrService, CiltSecuencesScheduleService, CustomLoggerService],
  exports: [CiltMstrService],
})
export class CiltMstrModule {}
