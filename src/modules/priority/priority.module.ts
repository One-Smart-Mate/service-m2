import { Module } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { PriorityController } from './priority.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriorityEntity } from './entities/priority.entity';
import { SiteModule } from '../site/site.module';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    SiteModule,
    UsersModule,
    FirebaseModule,
    TypeOrmModule.forFeature([PriorityEntity]),
  ],
  controllers: [PriorityController],
  providers: [PriorityService],
  exports: [PriorityService],
})
export class PriorityModule {}
