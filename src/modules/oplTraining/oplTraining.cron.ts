import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { OplTrainingService } from './oplTraining.service';

/**
 * Daily job that expires overdue OPL training and emails affected users.
 * Runs at 00:00 America/Mexico_City every day.
 */
@Injectable()
export class OplTrainingCronService {
  private processing = false;

  constructor(
    private readonly oplTrainingService: OplTrainingService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Cron('0 0 0 * * *', {
    name: 'oplTrainingExpiryTask',
    timeZone: 'America/Mexico_City',
  })
  async handleExpiryTask() {
    if (this.processing) return;
    this.processing = true;
    const startTime = Date.now();
    try {
      this.logger.logProcess('[CRON][OPL-TRAINING] Checking expired training...');
      const result = await this.oplTrainingService.processExpiredTraining();
      this.logger.logProcess(
        `[CRON][OPL-TRAINING] Done - expired: ${result.expired}, emailed: ${result.emailed}, took ${
          Date.now() - startTime
        }ms`,
      );
    } catch (error) {
      this.logger.logException(
        'OplTrainingCronService',
        'handleExpiryTask',
        error,
      );
    } finally {
      this.processing = false;
    }
  }
}
