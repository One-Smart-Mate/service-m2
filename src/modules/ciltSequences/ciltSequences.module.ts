import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CiltSequencesService } from './ciltSequences.service';
import { CiltSequencesController } from './ciltSequences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CiltSequencesEntity])],
  controllers: [CiltSequencesController],
  providers: [CiltSequencesService],
  exports: [CiltSequencesService],
})
export class CiltSequencesModule {} 