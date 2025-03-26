import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { PositionEntity } from './entities/position.entity';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { LevelModule } from '../level/level.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PositionEntity,UsersPositionsEntity,]), LevelModule, UsersModule],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionModule {}
