import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltMstrPositionLevelsController } from './ciltMstrPositionLevels.controller';
import { CiltMstrPositionLevelsService } from './ciltMstrPositionLevels.service';
import { CiltMstrPositionLevelsEntity } from './entities/ciltMstrPositionLevels.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { LevelEntity } from '../level/entities/level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltMstrPositionLevelsEntity,
      CiltMstrEntity,
      PositionEntity,
      LevelEntity
    ])
  ],
  controllers: [CiltMstrPositionLevelsController],
  providers: [CiltMstrPositionLevelsService],
  exports: [CiltMstrPositionLevelsService],
})
export class CiltMstrPositionLevelsModule {} 