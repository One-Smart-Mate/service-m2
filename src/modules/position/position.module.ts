import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { PositionEntity } from './entities/position.entity';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { LevelModule } from '../level/level.module';
import { UsersModule } from '../users/users.module';
import { SiteEntity } from '../site/entities/site.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PositionEntity,
      UsersPositionsEntity,
      SiteEntity,
      LevelEntity,
      UserEntity
    ]),
    LevelModule,
    UsersModule
  ],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionModule {}
