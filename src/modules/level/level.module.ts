import {  Module } from '@nestjs/common';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { CardEntity } from '../card/entities/card.entity';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';
import { FirebaseModule } from '../firebase/firebase.module';


@Module({
  imports: [UsersModule, SiteModule, FirebaseModule, TypeOrmModule.forFeature([LevelEntity, CardEntity])],
  controllers: [LevelController],
  providers: [LevelService],
  exports: [LevelService]
})
export class LevelModule { }
