import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CiltSequencesService } from './ciltSequences.service';
import { CiltSequencesController } from './ciltSequences.controller';
import { SiteEntity } from '../site/entities/site.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSequencesEntity,
      SiteEntity,
      LevelEntity,
      PositionEntity,
      CiltMstrEntity,
      CiltFrequenciesEntity,
    ]),
  ],
  controllers: [CiltSequencesController],
  providers: [CiltSequencesService],
  exports: [CiltSequencesService],
})
export class CiltSequencesModule {} 