import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { RolesModule } from '../roles/roles.module';
import { SiteModule } from '../site/site.module';
import { MailModule } from '../mail/mail.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';
import { UsersPositionsEntity } from './entities/users.positions.entity';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [
    SiteModule,
    RolesModule,
    MailModule,
    FirebaseModule,
    WhatsappModule,
    TypeOrmModule.forFeature([UserEntity, UserHasSitesEntity, UsersPositionsEntity]),
  ],
  providers: [UsersService, CustomLoggerService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
