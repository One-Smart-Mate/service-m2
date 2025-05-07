import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesEvidencesController } from './ciltSequencesEvidences.controller';
import { CiltSequencesEvidencesService } from './ciltSequencesEvidences.service';
import { CiltSequencesEvidencesEntity } from './entities/ciltSequencesEvidences.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CiltSequencesEvidencesEntity])],
  controllers: [CiltSequencesEvidencesController],
  providers: [CiltSequencesEvidencesService],
  exports: [CiltSequencesEvidencesService],
})
export class CiltSequencesEvidencesModule {} 