import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltMstrController } from './ciltMstr.controller';
import { CiltMstrService } from './ciltMstr.service';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { CiltSecuencesScheduleModule } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.module';
import { LevelModule } from '../level/level.module';
import { CustomLoggerService } from 'src/common/logger/logger.service';

// Nuevos servicios específicos
import { CiltExecutionService } from './services/cilt-execution.service';
import { CiltPositionLevelService } from './services/cilt-position-level.service';
import { CiltValidationService } from './services/cilt-validation.service';
import { CiltQueryBuilderService } from './services/cilt-query-builder.service';
import { CiltQueryService } from './services/cilt-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltMstrEntity,
      UserEntity,
      UsersPositionsEntity,
      CiltSequencesEntity,
      CiltSequencesExecutionsEntity,
      CiltMstrPositionLevelsEntity,
      OplMstr,
    ]),
    CiltSecuencesScheduleModule,
    LevelModule,
  ],
  controllers: [CiltMstrController],
  providers: [
    CiltMstrService,
    CiltExecutionService,
    CiltPositionLevelService,
    CiltValidationService,
    CiltQueryBuilderService,
    CiltQueryService,
    CustomLoggerService,
  ],
  exports: [
    CiltMstrService,
    CiltExecutionService,
    CiltPositionLevelService,
    CiltValidationService,
    CiltQueryBuilderService,
    CiltQueryService,
  ],
})
export class CiltMstrModule {}
