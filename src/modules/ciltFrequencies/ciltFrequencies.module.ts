import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltFrequenciesEntity } from './entities/ciltFrequencies.entity';
import { CiltFrequenciesService } from './ciltFrequencies.service';
import { CiltFrequenciesController } from './ciltFrequencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CiltFrequenciesEntity])],
  controllers: [CiltFrequenciesController],
  providers: [CiltFrequenciesService],
  exports: [CiltFrequenciesService],
})
export class CiltFrequenciesModule {} 