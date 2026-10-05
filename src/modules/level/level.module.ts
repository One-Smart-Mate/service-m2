import { Module } from '@nestjs/common';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelEntity } from './entities/level.entity';
import { CardEntity } from '../card/entities/card.entity';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { LevelHierarchyPersistence } from './level-hierarchy.persistence';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    SiteModule,
    FirebaseModule,
    NotificationsModule,
    TypeOrmModule.forFeature([LevelEntity, CardEntity]),
  ],
  controllers: [LevelController],
  providers: [LevelService, LevelHierarchyPersistence],
  exports: [LevelService],
})
export class LevelModule {}
