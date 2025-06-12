import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SiteService } from '../site/site.service';
import { CiltMstrService } from '../ciltMstr/ciltMstr.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Injectable()
export class TaskService {

  constructor(
    private readonly siteService: SiteService,
    private readonly ciltMstrService: CiltMstrService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'dailySiteProcessingTask',
  })
  async handleDailyTask() {
    try {
      const currentDate = new Date();
      this.logger.logProcess(`Starting task for ${currentDate.toISOString()}`);
      
      const sites = await this.siteService.findAll();
      
      for (const site of sites) {
        try {
          this.logger.logProcess(`Processing CILTs for site ID: ${site.id} - Date: ${currentDate.toISOString()}`);
          const cilts = await this.ciltMstrService.findCiltsBySiteId(site.id, currentDate.toISOString());
          this.logger.logProcess(`Found ${cilts.total || 0} CILTs for site ${site.id}`);
          
        } catch (error) {
          this.logger.logProcess(`Error processing site ${site.id}: ${error.message}`);
          continue;
        }
      }
      
      this.logger.logProcess(`Task completed for ${currentDate.toISOString()}`);
    } catch (error) {
      this.logger.logProcess(`Error in task: ${error.message}`);
    }
  }
} 