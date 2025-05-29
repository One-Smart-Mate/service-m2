import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesEvidencesController } from './ciltSequencesEvidences.controller';
import { CiltSequencesEvidencesService } from './ciltSequencesEvidences.service';
import { CiltSequencesEvidencesEntity } from './entities/ciltSequencesEvidences.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { SiteEntity } from '../site/entities/site.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSequencesEvidencesEntity,
      CiltMstrEntity,
      CiltSequencesExecutionsEntity,
      PositionEntity,
      SiteEntity
    ])
  ],
  controllers: [CiltSequencesEvidencesController],
  providers: [CiltSequencesEvidencesService],
  exports: [CiltSequencesEvidencesService],
})
export class CiltSequencesEvidencesModule {} 