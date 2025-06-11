import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSequencesExecutionsController } from './ciltSequencesExecutions.controller';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { CiltSequencesEntity } from '../CiltSequences/entities/ciltSequences.entity';
import { CiltMstrModule } from '../ciltMstr/ciltMstr.module';
import { CiltSequencesModule } from '../ciltSequences/ciltSequences.module';
import { SiteModule } from '../site/site.module';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { MailModule } from '../mail/mail.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { PositionEntity } from 'src/modules/position/entities/position.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UserHasSitesEntity } from 'src/modules/users/entities/user.has.sites.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { RolesModule } from 'src/modules/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltSequencesExecutionsEntity,
      CiltSequencesEntity,
      PositionEntity,
      UserEntity,
      UserHasSitesEntity,
      UsersPositionsEntity,
    ]),
    forwardRef(() => CiltMstrModule),
    forwardRef(() => CiltSequencesModule),
    forwardRef(() => SiteModule),
    forwardRef(() => MailModule),
    forwardRef(() => FirebaseModule),
    UsersModule,
    RolesModule,
  ],
  controllers: [CiltSequencesExecutionsController],
  providers: [CiltSequencesExecutionsService, CustomLoggerService],
  exports: [CiltSequencesExecutionsService],
})
export class CiltSequencesExecutionsModule {}
