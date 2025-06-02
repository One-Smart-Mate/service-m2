import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { SiteModule } from '../site/site.module';
import { CiltMstrModule } from '../ciltMstr/ciltMstr.module';
import { CustomLoggerService } from '../../common/logger/logger.service';
@Module({ 
  imports: [SiteModule, CiltMstrModule],
  providers: [TaskService, CustomLoggerService],
  exports: [TaskService],
})
export class TaskModule {} 