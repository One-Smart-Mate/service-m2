import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltSecuencesScheduleController } from './ciltSecuencesSchedule.controller';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CiltSecuencesScheduleEntity])],
  controllers: [CiltSecuencesScheduleController],
  providers: [CiltSecuencesScheduleService],
  exports: [CiltSecuencesScheduleService],
})
export class CiltSecuencesScheduleModule {} 