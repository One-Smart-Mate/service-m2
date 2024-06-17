import { Module } from '@nestjs/common';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [UsersModule , SiteModule,TypeOrmModule.forFeature([LevelEntity])],
  controllers: [LevelController],
  providers: [LevelService],
})
export class LevelModule {}
