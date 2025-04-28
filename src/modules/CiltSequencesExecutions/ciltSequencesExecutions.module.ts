import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesExecutionsController } from './ciltSequencesExecutions.controller';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { PositionEntity } from 'src/modules/position/entities/position.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UserHasSitesEntity } from 'src/modules/users/entities/user.has.sites.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { MailModule } from 'src/modules/mail/mail.module';
import { FirebaseModule } from 'src/modules/firebase/firebase.module';
import { SiteModule } from 'src/modules/site/site.module';
import { RolesModule } from 'src/modules/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSequencesExecutionsEntity,
      PositionEntity,
      UserEntity,
      UserHasSitesEntity,
      UsersPositionsEntity,
    ]),
    UsersModule,
    MailModule,
    FirebaseModule,
    SiteModule,
    RolesModule,
  ],
  controllers: [CiltSequencesExecutionsController],
  providers: [CiltSequencesExecutionsService],
  exports: [CiltSequencesExecutionsService],
})
export class CiltSequencesExecutionsModule {}
