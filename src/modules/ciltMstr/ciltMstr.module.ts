import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltMstrController } from './ciltMstr.controller';
import { CiltMstrService } from './ciltMstr.service';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CiltMstrEntity,
      UserEntity,
      UsersPositionsEntity,
      CiltSequencesEntity,
      CiltSequencesExecutionsEntity,
    ]),
  ],
  controllers: [CiltMstrController],
  providers: [CiltMstrService],
  exports: [CiltMstrService],
})
export class CiltMstrModule {}
