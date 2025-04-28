import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesFrequencies } from './entities/ciltSequencesFrequencies.entity';
import { CiltSequencesFrequenciesService } from './ciltSequencesFrequencies.service';
import { CiltSequencesFrequenciesController } from './ciltSequencesFrequencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CiltSequencesFrequencies])],
  controllers: [CiltSequencesFrequenciesController],
  providers: [CiltSequencesFrequenciesService],
  exports: [CiltSequencesFrequenciesService],
})
export class CiltSequencesFrequenciesModule {} 