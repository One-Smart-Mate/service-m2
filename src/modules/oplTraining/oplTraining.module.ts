import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplTrainingController } from './oplTraining.controller';
import { OplTrainingService } from './oplTraining.service';
import { OplTrainingCronService } from './oplTraining.cron';
import { OplPositionAssignmentEntity } from './entities/oplPositionAssignment.entity';
import { OplTrainingRecordEntity } from './entities/oplTrainingRecord.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { MailModule } from '../mail/mail.module';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OplPositionAssignmentEntity,
      OplTrainingRecordEntity,
      OplMstr,
      PositionEntity,
      UserEntity,
      UsersPositionsEntity,
    ]),
    MailModule,
  ],
  controllers: [OplTrainingController],
  providers: [OplTrainingService, OplTrainingCronService, CustomLoggerService],
  exports: [OplTrainingService],
})
export class OplTrainingModule {}
