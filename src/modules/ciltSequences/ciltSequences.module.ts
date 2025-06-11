import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CiltSequencesService } from './ciltSequences.service';
import { CiltSequencesController } from './ciltSequences.controller';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { CiltTypesEntity } from '../ciltTypes/entities/ciltTypes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSequencesEntity,
      SiteEntity,
      CiltMstrEntity,
      CiltFrequenciesEntity,
      OplMstr,
      CiltTypesEntity,
    ]),
  ],
  controllers: [CiltSequencesController],
  providers: [CiltSequencesService],
  exports: [CiltSequencesService],
})
export class CiltSequencesModule {} 