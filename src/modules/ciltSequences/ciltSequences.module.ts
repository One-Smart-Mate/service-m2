import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequences } from './entities/ciltSequences.entity';
import { CiltSequencesService } from './ciltSequences.service';
import { CiltSequencesController } from './ciltSequences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CiltSequences])],
  controllers: [CiltSequencesController],
  providers: [CiltSequencesService],
  exports: [CiltSequencesService],
})
export class CiltSequencesModule {} 