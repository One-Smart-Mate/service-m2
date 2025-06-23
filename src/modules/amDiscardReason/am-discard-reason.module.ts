import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmDiscardReasonController } from './am-discard-reason.controller';
import { AmDiscardReasonService } from './am-discard-reason.service';
import { AmDiscardReasonEntity } from './entities/am-discard-reason.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AmDiscardReasonEntity])],
  controllers: [AmDiscardReasonController],
  providers: [AmDiscardReasonService],
})
export class AmDiscardReasonModule {} 