import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplMstr } from './entities/oplMstr.entity';
import { OplMstrService } from './oplMstr.service';
import { OplMstrController } from './oplMstr.controller';
import { OplLevelsEntity } from '../oplLevels/entities/oplLevels.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OplMstr, OplLevelsEntity, LevelEntity, OplDetailsEntity])],
  controllers: [OplMstrController],
  providers: [OplMstrService],
  exports: [OplMstrService],
})
export class OplMstrModule {} 