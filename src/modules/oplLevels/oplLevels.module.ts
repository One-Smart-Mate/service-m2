import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplLevelsController } from './oplLevels.controller';
import { OplLevelsService } from './oplLevels.service';
import { OplLevelsEntity } from './entities/oplLevels.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OplLevelsEntity, LevelEntity, OplMstr, OplDetailsEntity])
  ],
  controllers: [OplLevelsController],
  providers: [OplLevelsService],
  exports: [OplLevelsService],
})
export class OplLevelsModule {} 