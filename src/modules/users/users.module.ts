import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { RolesModule } from '../roles/roles.module';
import { SiteModule } from '../site/site.module';
import { MailModule } from '../mail/mail.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';

@Module({
  imports: [
    SiteModule,
    RolesModule,
    MailModule,
    FirebaseModule,
    TypeOrmModule.forFeature([UserEntity, UserHasSitesEntity]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
