import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplMstr } from './entities/oplMstr.entity';
import { OplMstrService } from './oplMstr.service';
import { OplMstrController } from './oplMstr.controller';
import { OplLevelsEntity } from '../oplLevels/entities/oplLevels.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';
import { OplTypes } from '../oplTypes/entities/oplTypes.entity';
import { UserEntity } from '../users/entities/user.entity';
import { OplMasterPersistence } from './opl-master.persistence';

@Module({
  imports: [TypeOrmModule.forFeature([OplMstr, OplLevelsEntity, LevelEntity, OplDetailsEntity, OplTypes, UserEntity])],
  controllers: [OplMstrController],
  providers: [OplMstrService, OplMasterPersistence],
  exports: [OplMstrService],
})
export class OplMstrModule {}
