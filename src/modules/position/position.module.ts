import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { PositionEntity } from './entities/position.entity';
import { LevelModule } from '../level/level.module';

@Module({
  imports: [TypeOrmModule.forFeature([PositionEntity]), LevelModule],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionModule {}
