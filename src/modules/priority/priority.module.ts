import { Module } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { PriorityController } from './priority.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriorityEntity } from './entities/priority.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriorityEntity])],
  controllers: [PriorityController],
  providers: [PriorityService],
})
export class PriorityModule {}
