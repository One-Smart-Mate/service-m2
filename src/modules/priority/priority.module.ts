import { Module } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { PriorityController } from './priority.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriorityEntity } from './entities/priority.entity';
import { CompanyModule } from '../company/company.module';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [SiteModule, TypeOrmModule.forFeature([PriorityEntity])],
  controllers: [PriorityController],
  providers: [PriorityService],
  exports: [PriorityService]
})
export class PriorityModule {}
