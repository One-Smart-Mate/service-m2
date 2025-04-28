import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesExecutionsController } from './ciltSequencesExecutions.controller';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CiltSequencesExecutionsEntity])],
  controllers: [CiltSequencesExecutionsController],
  providers: [CiltSequencesExecutionsService],
  exports: [CiltSequencesExecutionsService],
})
export class CiltSequencesExecutionsModule {} 