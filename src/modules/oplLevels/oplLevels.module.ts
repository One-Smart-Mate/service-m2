import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplLevelsController } from './oplLevels.controller';
import { OplLevelsService } from './oplLevels.service';
import { OplLevelsEntity } from './entities/oplLevels.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OplLevelsEntity, LevelEntity, OplMstr])
  ],
  controllers: [OplLevelsController],
  providers: [OplLevelsService],
  exports: [OplLevelsService],
})
export class OplLevelsModule {} 