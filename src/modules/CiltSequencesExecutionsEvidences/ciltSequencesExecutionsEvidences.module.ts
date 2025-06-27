import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesExecutionsEvidencesService } from './ciltSequencesExecutionsEvidences.service';
import { CiltSequencesExecutionsEvidencesEntity } from './entities/ciltSequencesExecutionsEvidences.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { SiteEntity } from '../site/entities/site.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSequencesExecutionsEvidencesEntity,
      CiltMstrEntity,
      CiltSequencesExecutionsEntity,
      PositionEntity,
      SiteEntity
    ])
  ],
  controllers: [],
  providers: [CiltSequencesExecutionsEvidencesService],
  exports: [CiltSequencesExecutionsEvidencesService],
})
export class CiltSequencesExecutionsEvidencesModule {} 